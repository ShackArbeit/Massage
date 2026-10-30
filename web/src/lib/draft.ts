import type { FieldValue, FormValues } from "../survey/questions";

// 填寫草稿暫存於 localStorage；簽名圖不存
const DRAFT_KEY = "massage-feedback-draft-v1";
const EXCLUDED = new Set(["signature"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// 只接受型別與預設值一致的欄位，避免舊版或損壞的草稿污染表單
function matchesShape(def: FieldValue, v: unknown): v is FieldValue {
  if (typeof def === "string") return typeof v === "string";
  if (typeof def === "boolean") return typeof v === "boolean";
  if (def === null || typeof def === "number") return v === null || typeof v === "number";
  if (Array.isArray(def)) return Array.isArray(v) && v.every((x) => typeof x === "string");
  return (
    isRecord(v) &&
    typeof v.zh === "string" &&
    typeof v.de === "string" &&
    typeof v.deEditedByUser === "boolean" &&
    (v.translatedFrom === null || typeof v.translatedFrom === "string")
  );
}

export function loadDraft(defaults: FormValues): FormValues {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaults;
    const out: FormValues = { ...defaults };
    for (const [key, def] of Object.entries(defaults)) {
      if (EXCLUDED.has(key)) continue;
      const v = parsed[key];
      if (matchesShape(def, v)) out[key] = v;
    }
    return out;
  } catch {
    return defaults;
  }
}

export function saveDraft(values: FormValues): void {
  try {
    const copy: FormValues = {};
    for (const [key, v] of Object.entries(values)) {
      if (!EXCLUDED.has(key)) copy[key] = v;
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(copy));
  } catch {
    // 私密模式或儲存空間被封鎖時略過
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // 略過
  }
}
