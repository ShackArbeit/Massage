import { useState } from "react";
import BilingualLabel from "../components/form/BilingualLabel";
import ButtonLabel from "../components/form/ButtonLabel";
import { Spinner } from "../components/icons";
import { signInAdmin } from "../lib/auth";
import type { Bi } from "../survey/questions";

export default function AdminLogin({ deniedEmail }: { deniedEmail?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Bi>();

  async function login() {
    setBusy(true);
    setError(undefined);
    try {
      await signInAdmin();
    } catch {
      setError({ zh: "登入失敗或已取消，請再試一次。", de: "Anmeldung fehlgeschlagen oder abgebrochen. Bitte erneut versuchen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <h1>
          <BilingualLabel text={{ zh: "後台登入", de: "Verwaltung – Anmeldung" }} size="lg" />
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          僅限管理員 <span lang="de">· Nur für Administratoren</span>
        </p>

        {deniedEmail && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            此帳號沒有權限，已自動登出：{deniedEmail}
            <br />
            <span lang="de" className="text-xs">
              Kein Zugriff für dieses Konto – Sie wurden abgemeldet.
            </span>
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error.zh}
            <br />
            <span lang="de" className="text-xs">
              {error.de}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={login}
          disabled={busy}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
        >
          {busy && <Spinner />}
          <ButtonLabel text={{ zh: "使用 Google 帳號登入", de: "Mit Google anmelden" }} />
        </button>
      </div>
    </main>
  );
}
