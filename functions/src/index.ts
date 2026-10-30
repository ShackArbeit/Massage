import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { consumeRateLimit } from "./rateLimit";
import { GeminiProvider, MockProvider, type TranslateItem, type TranslationProvider } from "./translate";

initializeApp();
setGlobalOptions({ region: "asia-east1", maxInstances: 5 });

// 設定值可在 functions/.env（部署）或 functions/.env.local（僅模擬器）覆寫
const PROVIDER = defineString("TRANSLATE_PROVIDER", { default: "gemini" });
const GEMINI_MODEL = defineString("GEMINI_MODEL", { default: "gemini-3.8-flash" });
const GEMINI_LOCATION = defineString("GEMINI_LOCATION", { default: "global" });

const MAX_ITEMS = 3;
const MAX_CHARS = 1000;
const RATE_LIMIT_PER_HOUR = 30;
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

let provider: TranslationProvider | undefined;
function getProvider(): TranslationProvider {
  if (!provider) {
    provider =
      PROVIDER.value() === "mock"
        ? new MockProvider()
        : new GeminiProvider(process.env.GCLOUD_PROJECT ?? "", GEMINI_LOCATION.value(), GEMINI_MODEL.value());
  }
  return provider;
}

function parseInput(data: unknown): TranslateItem[] {
  const invalid = () => new HttpsError("invalid-argument", "輸入格式錯誤 / Ungültige Eingabe.");
  if (typeof data !== "object" || data === null || !("items" in data) || !Array.isArray(data.items)) throw invalid();
  const items: unknown[] = data.items;
  if (items.length < 1 || items.length > MAX_ITEMS) throw invalid();

  const seen = new Set<string>();
  return items.map((item) => {
    if (typeof item !== "object" || item === null || !("key" in item) || !("zh" in item)) throw invalid();
    const { key, zh } = item;
    if (typeof key !== "string" || !/^[A-Za-z0-9_]{1,40}$/.test(key) || seen.has(key)) throw invalid();
    if (typeof zh !== "string" || zh.trim() === "" || zh.length > MAX_CHARS) throw invalid();
    seen.add(key);
    return { key, zh: zh.trim() };
  });
}

function sourceOf(req: CallableRequest): string {
  const forwarded = req.rawRequest.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.rawRequest.ip || "unknown";
}

export const translateToGerman = onCall(
  {
    enforceAppCheck: !isEmulator, // 模擬器不驗證 App Check
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req) => {
    const items = parseInput(req.data);

    if (!(await consumeRateLimit(sourceOf(req), RATE_LIMIT_PER_HOUR))) {
      throw new HttpsError("resource-exhausted", "翻譯次數已達上限 / Zu viele Übersetzungen.");
    }

    try {
      return { items: await getProvider().translate(items) };
    } catch (e) {
      // 不記錄使用者內容，只記錄錯誤類型與訊息（LLM／權限錯誤訊息不含使用者文字）
      const reason = e instanceof Error ? `${e.name}: ${e.message}` : "unknown";
      logger.error("translation failed", { itemCount: items.length, provider: PROVIDER.value(), reason });
      // 模擬器才把原因回傳給前端，方便在瀏覽器 Console 排查
      throw new HttpsError("internal", "翻譯失敗 / Übersetzung fehlgeschlagen.", isEmulator ? { reason } : undefined);
    }
  },
);
