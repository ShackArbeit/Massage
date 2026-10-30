import type { Timestamp } from "firebase/firestore";
import { otherKeyOf, RATING_LABELS, type Bi, type Question, type Section } from "./questions";
import type { Submission } from "./submission";

// 已存資料 → 顯示用答案（後台詳細頁與列印版型共用）。未填的題目回傳 null。
export type Answer =
  | { kind: "text"; text: string }
  | { kind: "options"; options: Bi[]; other?: string }
  | { kind: "rating"; value: number; label: Bi }
  | { kind: "scale"; value: number; minLabel: Bi; maxLabel: Bi }
  | { kind: "comment"; zh: string; de: string; edited: boolean }
  | { kind: "check"; label: Bi }
  | { kind: "signature"; src: string }
  | { kind: "date"; text: string };

export function formatTimestamp(ts: Timestamp | undefined): string {
  if (!ts) return "";
  // sv-SE 格式：YYYY-MM-DD HH:mm:ss
  return ts.toDate().toLocaleString("sv-SE").slice(0, 16);
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function isRatingScore(n: number): n is 1 | 2 | 3 | 4 | 5 {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export function answerOf(sub: Submission, q: Question): Answer | null {
  const rec: Record<string, unknown> = sub;
  const value = rec[q.key];
  switch (q.type) {
    case "text":
    case "email":
    case "date":
      return typeof value === "string" && value !== "" ? { kind: "text", text: value } : null;
    case "number":
      return typeof value === "number" ? { kind: "text", text: String(value) } : null;
    case "single":
    case "multi": {
      const codes = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
      const options = q.options.filter((o) => codes.includes(o.code)).map((o) => o.label);
      if (options.length === 0) return null;
      const other = rec[otherKeyOf(q.key)];
      return { kind: "options", options, other: typeof other === "string" ? other : undefined };
    }
    case "rating": {
      const n = sub.ratings?.[q.storeKey];
      return typeof n === "number" && isRatingScore(n) ? { kind: "rating", value: n, label: RATING_LABELS[n] } : null;
    }
    case "slider":
    case "scale10":
      return typeof value === "number" ? { kind: "scale", value, minLabel: q.minLabel, maxLabel: q.maxLabel } : null;
    case "comment": {
      const c = sub.comments?.[q.storeKey];
      return c ? { kind: "comment", zh: c.zh, de: c.de, edited: c.deEditedByUser } : null;
    }
    case "checkbox":
      return value === true ? { kind: "check", label: q.label } : null;
    case "signature":
      return sub.signaturePng ? { kind: "signature", src: sub.signaturePng } : null;
    case "autoDate":
      return sub.createdAt ? { kind: "date", text: formatTimestamp(sub.createdAt) } : null;
  }
}

// 一個區塊中「有填寫」的題目與答案，題號依顯示順序重新產生
export function answeredQuestions(sub: Submission, section: Section): { q: Question; number: string; answer: Answer }[] {
  const out: { q: Question; number: string; answer: Answer }[] = [];
  for (const q of section.questions) {
    const answer = answerOf(sub, q);
    if (answer) out.push({ q, number: `${section.id}${out.length + 1}`, answer });
  }
  return out;
}

export function optionText(q: Question | undefined, sub: Submission): Bi | undefined {
  if (!q) return undefined;
  const a = answerOf(sub, q);
  if (!a || a.kind !== "options") return undefined;
  const first = a.options[0];
  return a.other ? { zh: `${first.zh}：${a.other}`, de: `${first.de}: ${a.other}` } : first;
}
