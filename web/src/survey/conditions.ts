import {
  allQuestions,
  defaultValueFor,
  hasOtherOption,
  otherKeyOf,
  type FieldValue,
  type FormValues,
  type Question,
} from "./questions";

// 有工作姿勢負擔的工作型態（學生、無工作、其他時隱藏 postureHours）
const POSTURE_WORK_TYPES = ["sitting", "standing", "mixed", "physical", "mobile"];

// 條件顯示規則：未列出的題目一律顯示
const conditions: Partial<Record<string, (v: FormValues) => boolean>> = {
  exerciseTypes: (v) => typeof v.exerciseFreq === "string" && v.exerciseFreq !== "" && v.exerciseFreq !== "none",
  selfMassageTools: (v) =>
    typeof v.selfMassageFreq === "string" && v.selfMassageFreq !== "" && v.selfMassageFreq !== "never",
  postureHours: (v) => typeof v.workType === "string" && POSTURE_WORK_TYPES.includes(v.workType),
  painAfter: (v) => typeof v.painBefore === "number",
};

export function isVisible(key: string, values: FormValues): boolean {
  const cond = conditions[key];
  return cond ? cond(values) : true;
}

// 「其他」選項是否被選取（決定其他文字欄是否顯示／必填）
export function isOtherSelected(q: Question, values: FormValues): boolean {
  if (!hasOtherOption(q)) return false;
  const otherCodes = q.options.filter((o) => o.other).map((o) => o.code);
  const v = values[q.key];
  if (typeof v === "string") return otherCodes.includes(v);
  if (Array.isArray(v)) return v.some((c) => otherCodes.includes(c));
  return false;
}

export function isEmptyValue(v: FieldValue | undefined): boolean {
  if (v === undefined || v === null || v === "" || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return v.zh.trim() === "" && v.de.trim() === "";
  return false;
}

// 需要清除的殘留值：被隱藏的題目，以及未選「其他」時的其他文字欄
export function staleFields(values: FormValues): { name: string; value: FieldValue }[] {
  const out: { name: string; value: FieldValue }[] = [];
  for (const q of allQuestions) {
    const visible = isVisible(q.key, values);
    const def = defaultValueFor(q);
    if (!visible && def !== undefined && !isEmptyValue(values[q.key])) {
      out.push({ name: q.key, value: def });
    }
    if (hasOtherOption(q)) {
      const ok = otherKeyOf(q.key);
      if ((!visible || !isOtherSelected(q, values)) && values[ok] !== "") {
        out.push({ name: ok, value: "" });
      }
    }
  }
  return out;
}

// 送出前移除隱藏題與空值，隱藏的題目不得進入送出資料
export function pruneHidden(values: FormValues): FormValues {
  const out: FormValues = {};
  for (const q of allQuestions) {
    if (!isVisible(q.key, values)) continue;
    const v = values[q.key];
    if (v !== undefined && !isEmptyValue(v)) out[q.key] = v;
    if (hasOtherOption(q) && isOtherSelected(q, values)) {
      const ok = otherKeyOf(q.key);
      const other = values[ok];
      if (typeof other === "string" && other.trim() !== "") out[ok] = other.trim();
    }
  }
  return out;
}
