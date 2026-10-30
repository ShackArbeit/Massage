import { z } from "zod";
import { isOtherSelected, isVisible } from "./conditions";
import {
  allQuestions,
  OTHER_MAX_LENGTH,
  otherKeyOf,
  type Bi,
  type CommentValue,
  type FieldValue,
  type FormValues,
  type Question,
} from "./questions";

export type ErrorCode =
  | "required"
  | "tooLong"
  | "invalidEmail"
  | "outOfRange"
  | "invalidDate"
  | "futureDate"
  | "otherRequired"
  | "needGerman"
  | "staleGerman"
  | "mustCheck"
  | "signatureRequired";

export const errorMessages: Record<ErrorCode, Bi> = {
  required: { zh: "此題為必填", de: "Pflichtfeld" },
  tooLong: { zh: "內容過長", de: "Der Text ist zu lang" },
  invalidEmail: { zh: "Email 格式不正確", de: "Ungültige E-Mail-Adresse" },
  outOfRange: { zh: "數值超出範圍", de: "Wert außerhalb des gültigen Bereichs" },
  invalidDate: { zh: "日期格式不正確", de: "Ungültiges Datum" },
  futureDate: { zh: "日期不得晚於今天", de: "Das Datum darf nicht in der Zukunft liegen" },
  otherRequired: { zh: "請填寫「其他」的內容", de: "Bitte „Sonstiges“ näher angeben" },
  needGerman: { zh: "請先翻成德文", de: "Bitte zuerst ins Deutsche übersetzen" },
  staleGerman: {
    zh: "中文已修改，德文已過期，請重新翻譯",
    de: "Der chinesische Text wurde geändert – bitte erneut übersetzen",
  },
  mustCheck: { zh: "請勾選以確認", de: "Bitte bestätigen" },
  signatureRequired: { zh: "請簽名", de: "Bitte unterschreiben" },
};

export function messageFor(code: string | undefined): Bi | undefined {
  if (!code) return undefined;
  return code in errorMessages ? errorMessages[code as ErrorCode] : { zh: code, de: code };
}

export function todayISO(): string {
  // sv-SE 的日期格式即為 YYYY-MM-DD（使用者本地時區）
  return new Date().toLocaleDateString("sv-SE");
}

export function isCommentValue(v: FieldValue | undefined): v is CommentValue {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const emailSchema = z.email();
const dateSchema = z.iso.date();
const intString = z.string().regex(/^\d+$/);
const intIn = (min: number, max: number) => z.number().int().min(min).max(max);

// 回傳單一題的錯誤代碼；undefined 代表通過
function checkQuestion(q: Question, v: FieldValue | undefined): ErrorCode | undefined {
  switch (q.type) {
    case "text": {
      const s = typeof v === "string" ? v.trim() : "";
      if (s === "") return q.required ? "required" : undefined;
      return s.length > q.maxLength ? "tooLong" : undefined;
    }
    case "number": {
      const s = typeof v === "string" ? v.trim() : "";
      if (s === "") return q.required ? "required" : undefined;
      if (!intString.safeParse(s).success) return "outOfRange";
      return intIn(q.min, q.max).safeParse(Number(s)).success ? undefined : "outOfRange";
    }
    case "email": {
      const s = typeof v === "string" ? v.trim() : "";
      if (s === "") return q.required ? "required" : undefined;
      return emailSchema.safeParse(s).success ? undefined : "invalidEmail";
    }
    case "date": {
      const s = typeof v === "string" ? v : "";
      if (s === "") return q.required ? "required" : undefined;
      if (!dateSchema.safeParse(s).success) return "invalidDate";
      return q.notAfterToday && s > todayISO() ? "futureDate" : undefined;
    }
    case "single": {
      const s = typeof v === "string" ? v : "";
      if (s === "") return q.required ? "required" : undefined;
      return q.options.some((o) => o.code === s) ? undefined : "required";
    }
    case "multi": {
      const arr = Array.isArray(v) ? v : [];
      if (arr.length === 0) return q.required ? "required" : undefined;
      return arr.every((c) => q.options.some((o) => o.code === c)) ? undefined : "required";
    }
    case "rating":
      if (v === null || v === undefined) return q.required ? "required" : undefined;
      return intIn(1, 5).safeParse(v).success ? undefined : "outOfRange";
    case "slider":
    case "scale10":
      if (v === null || v === undefined) return q.required ? "required" : undefined;
      return intIn(0, 10).safeParse(v).success ? undefined : "outOfRange";
    case "comment": {
      if (!isCommentValue(v)) return q.required ? "required" : undefined;
      const zh = v.zh.trim();
      if (zh === "") return q.required ? "required" : undefined;
      if (zh.length > q.maxLength) return "tooLong";
      if (v.de.trim() === "") return "needGerman";
      if (v.translatedFrom !== v.zh) return "staleGerman";
      return v.de.length > q.maxLength * 3 ? "tooLong" : undefined;
    }
    case "checkbox":
      return q.required && v !== true ? "mustCheck" : undefined;
    case "signature":
      return q.required && (typeof v !== "string" || v === "") ? "signatureRequired" : undefined;
    case "autoDate":
      return undefined;
  }
}

// 由題庫產生的表單 schema：只驗證目前「顯示中」的題目
export const surveySchema = z
  .custom<FormValues>((v) => typeof v === "object" && v !== null)
  .superRefine((values, ctx) => {
    for (const q of allQuestions) {
      if (!isVisible(q.key, values)) continue;
      const code = checkQuestion(q, values[q.key]);
      if (code) ctx.addIssue({ code: "custom", path: [q.key], message: code });

      if (isOtherSelected(q, values)) {
        const ok = otherKeyOf(q.key);
        const other = values[ok];
        const s = typeof other === "string" ? other.trim() : "";
        if (s === "") ctx.addIssue({ code: "custom", path: [ok], message: "otherRequired" });
        else if (s.length > OTHER_MAX_LENGTH) ctx.addIssue({ code: "custom", path: [ok], message: "tooLong" });
      }
    }
  });

// 題目是否已「完成」（用於進度條）
export function isAnswered(q: Question, values: FormValues): boolean {
  if (checkQuestion(q, values[q.key]) !== undefined) return false;
  if (isOtherSelected(q, values)) {
    const other = values[otherKeyOf(q.key)];
    return typeof other === "string" && other.trim() !== "";
  }
  return true;
}
