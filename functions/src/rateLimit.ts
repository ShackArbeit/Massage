import { createHash } from "node:crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const WINDOW_MS = 60 * 60 * 1000;


export async function consumeRateLimit(source: string, limit: number): Promise<boolean> {
  const id = createHash("sha256").update(source).digest("hex").slice(0, 32);
  const ref = getFirestore().collection("rateLimits").doc(id);
  const now = Date.now();

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const windowStart = snap.get("windowStart") as Timestamp | undefined;
    const count = (snap.get("count") as number | undefined) ?? 0;

    if (!windowStart || now - windowStart.toMillis() >= WINDOW_MS) {
      tx.set(ref, { windowStart: Timestamp.fromMillis(now), count: 1, expireAt: Timestamp.fromMillis(now + WINDOW_MS * 2) });
      return true;
    }
    if (count >= limit) return false;
    tx.update(ref, { count: count + 1 });
    return true;
  });
}
