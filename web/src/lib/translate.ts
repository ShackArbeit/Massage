import { FirebaseError } from "firebase/app";
import { FunctionsError, httpsCallable } from "firebase/functions";
import type { Bi } from "../survey/questions";
import { functions, usingEmulators } from "./firebase";

type TranslateRequest = { items: { key: string; zh: string }[] };
type TranslateResponse = { items: { key: string; de: string }[] };

const FUNCTION_NAME = "translateToGerman";
const translateCallable = httpsCallable<TranslateRequest, TranslateResponse>(functions, FUNCTION_NAME);

function endpoint(): string {
  return usingEmulators
    ? `http://${window.location.hostname}:5001/${functions.app.options.projectId ?? "?"}/${functions.region}/${FUNCTION_NAME}`
    : `https://${functions.region}-${functions.app.options.projectId ?? "?"}.cloudfunctions.net/${FUNCTION_NAME}`;
}

export async function translateOne(key: string, zh: string): Promise<string> {
  const res = await translateCallable({ items: [{ key, zh }] });
  const item = res.data.items.find((i) => i.key === key);
  if (!item || item.de.trim() === "") throw new Error(`empty translation (response items: ${res.data.items.length})`);
  return item.de;
}

function errorCode(e: unknown): string {
  return e instanceof FirebaseError ? e.code : e instanceof Error ? e.name : "unknown";
}

// 開發工具 Console 診斷（不輸出受試者填寫的內容）
export function logTranslateError(e: unknown, key: string): void {
  const info: Record<string, unknown> = {
    key,
    endpoint: endpoint(),
    mode: usingEmulators ? "emulator" : "cloud",
    code: errorCode(e),
    message: e instanceof Error ? e.message : String(e),
  };
  if (e instanceof FunctionsError) info.details = e.details;
  if (e instanceof FirebaseError && e.customData) info.customData = e.customData;
  console.groupCollapsed(`[translate] 翻譯失敗 Übersetzung fehlgeschlagen – ${info.code}`);
  console.error(info);
  console.error(e);
  console.info(
    "常見原因 Häufige Ursachen:\n" +
      "• functions/internal → 看函式記錄（模擬器終端機或 npx firebase functions:log）\n" +
      "• functions/unauthenticated → App Check 驗證失敗（金鑰／網域／Console 註冊）\n" +
      "• functions/unavailable 或 TypeError: Failed to fetch → 連不到函式（模擬器沒開、手機連不到電腦、防火牆）\n" +
      "• functions/not-found → 函式名稱或 region 不符，或模擬器未載入函式",
  );
  console.groupEnd();
}

export function translateErrorMessage(e: unknown): Bi {
  const code = errorCode(e);
  if (code === "functions/resource-exhausted") {
    return {
      zh: "翻譯次數已達上限，請稍後再試。",
      de: "Zu viele Übersetzungen. Bitte versuchen Sie es später erneut.",
    };
  }
  return {
    zh: `翻譯失敗，請稍後再試。（錯誤代碼：${code}）`,
    de: `Übersetzung fehlgeschlagen. Bitte versuchen Sie es erneut. (Fehlercode: ${code})`,
  };
}
