import type { Timestamp } from "firebase/firestore";
import { pruneHidden } from "./conditions";
import { allQuestions, otherKeyOf, type CommentKey, type FormValues, type RatingKey } from "./questions";
import { isCommentValue } from "./schema";

export type CommentEntry = { zh: string; de: string; deEditedByUser: boolean };

// Firestore 文件結構（第 9 章）。選擇題一律存選項代碼。
export type Submission = {
  schemaVersion: 1;
  createdAt: Timestamp;
  name: string;
  gender: string;
  age: number;
  email: string;
  massageDate: string;
  duration: string;
  massageType: string;
  massageTypeOther?: string;
  relationship: string;
  relationshipOther?: string;
  complaintAreas?: string[];
  complaintAreasOther?: string;
  painBefore?: number;
  workType?: string;
  workTypeOther?: string;
  postureHours?: string;
  exerciseFreq?: string;
  exerciseTypes?: string[];
  exerciseTypesOther?: string;
  stretchFreq?: string;
  selfMassageFreq?: string;
  selfMassageTools?: string[];
  selfMassageToolsOther?: string;
  ratings: Record<RatingKey, number>;
  painAfter?: number;
  rebook: "yes" | "maybe" | "no";
  recommend: number;
  comments: Partial<Record<CommentKey, CommentEntry>>;
  confirmTruthful: true;
  consentStorage: true;
  signaturePng: string;
};

type StoredValue = string | string[] | number | boolean | Record<string, number> | Record<string, CommentEntry>;
export type SubmissionData = Record<string, StoredValue>;

// 表單值 → Firestore 文件（不含 createdAt）。隱藏題與空白選填題不會出現。
export function buildSubmission(values: FormValues): SubmissionData {
  const v = pruneHidden(values);
  const ratings: Record<string, number> = {};
  const comments: Record<string, CommentEntry> = {};
  const data: SubmissionData = { schemaVersion: 1 };

  for (const q of allQuestions) {
    const value = v[q.key];
    if (value === undefined) continue;
    switch (q.type) {
      case "text":
      case "email":
        if (typeof value === "string") data[q.key] = value.trim();
        break;
      case "number":
        if (typeof value === "string") data[q.key] = Number(value);
        break;
      case "date":
      case "single":
      case "multi":
      case "slider":
      case "scale10":
        if (typeof value === "string" || typeof value === "number" || Array.isArray(value)) data[q.key] = value;
        break;
      case "rating":
        if (typeof value === "number") ratings[q.storeKey] = value;
        break;
      case "comment":
        if (isCommentValue(value) && value.zh.trim() !== "") {
          comments[q.storeKey] = { zh: value.zh.trim(), de: value.de.trim(), deEditedByUser: value.deEditedByUser };
        }
        break;
      case "checkbox":
        if (value === true) data[q.key] = true;
        break;
      case "signature":
        if (typeof value === "string") data.signaturePng = value;
        break;
      case "autoDate":
        break;
    }
    const other = v[otherKeyOf(q.key)];
    if (typeof other === "string") data[otherKeyOf(q.key)] = other;
  }

  data.ratings = ratings;
  data.comments = comments;
  return data;
}
