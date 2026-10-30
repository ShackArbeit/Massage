import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./firebase";

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "").toLowerCase();

export type AdminAuthState =
  | { status: "loading" }
  | { status: "signedOut"; deniedEmail?: string }
  | { status: "admin"; user: User };

function isAdmin(user: User): boolean {
  return ADMIN_EMAIL !== "" && user.emailVerified && (user.email ?? "").toLowerCase() === ADMIN_EMAIL;
}

// 登入後檢查是否為管理員帳號；不是則顯示「無權限」並登出
export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({ status: "loading" });

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          setState((prev) => ({ status: "signedOut", deniedEmail: prev.status === "signedOut" ? prev.deniedEmail : undefined }));
        } else if (isAdmin(user)) {
          setState({ status: "admin", user });
        } else {
          setState({ status: "signedOut", deniedEmail: user.email ?? "?" });
          void signOut(auth);
        }
      }),
    [],
  );

  return state;
}

export async function signInAdmin(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}
