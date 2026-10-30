import { FirebaseError } from "firebase/app";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Bi, FormValues } from "../survey/questions";
import { buildSubmission } from "../survey/submission";
import { db } from "./firebase";

const TIMEOUT_MS = 30_000;

class SubmitTimeoutError extends Error {}

export async function submitSurvey(values: FormValues): Promise<string> {
  const data = buildSubmission(values);
  const write = addDoc(collection(db, "submissions"), { ...data, createdAt: serverTimestamp() });
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new SubmitTimeoutError()), TIMEOUT_MS);
  });
  try {
    const ref = await Promise.race([write, timeout]);
    return ref.id;
  } finally {
    window.clearTimeout(timer);
  }
}

export function submitErrorMessage(e: unknown): Bi {
  if (e instanceof SubmitTimeoutError || (e instanceof FirebaseError && e.code === "unavailable")) {
    return {
      zh: "網路連線不穩，送出失敗，請確認網路後再試一次。",
      de: "Keine stabile Verbindung. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
    };
  }
  if (e instanceof FirebaseError && e.code === "permission-denied") {
    return {
      zh: "資料未通過檢查，請確認各欄位後再試一次。",
      de: "Die Angaben wurden nicht akzeptiert. Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.",
    };
  }
  return {
    zh: "送出失敗，請稍後再試一次。",
    de: "Senden fehlgeschlagen. Bitte versuchen Sie es später erneut.",
  };
}
