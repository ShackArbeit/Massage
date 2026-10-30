import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import type { Submission } from "../survey/submission";
import { db } from "./firebase";

export type StoredSubmission = Submission & { id: string };

// 資料已由 Firestore Rules 驗證；這裡只確認關鍵欄位存在，避免畫面崩潰
function toStored(id: string, data: Record<string, unknown>): StoredSubmission | null {
  const ok =
    data.createdAt instanceof Timestamp &&
    typeof data.name === "string" &&
    typeof data.ratings === "object" &&
    data.ratings !== null &&
    typeof data.comments === "object" &&
    data.comments !== null;
  return ok ? ({ id, ...data } as unknown as StoredSubmission) : null;
}

export async function fetchSubmissions(): Promise<StoredSubmission[]> {
  const snap = await getDocs(query(collection(db, "submissions"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toStored(d.id, d.data())).filter((s): s is StoredSubmission => s !== null);
}

export async function fetchSubmission(id: string): Promise<StoredSubmission | null> {
  const snap = await getDoc(doc(db, "submissions", id));
  return snap.exists() ? toStored(snap.id, snap.data()) : null;
}

export async function deleteSubmission(id: string): Promise<void> {
  await deleteDoc(doc(db, "submissions", id));
}
