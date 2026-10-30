import { Link, Outlet } from "react-router-dom";
import { SubmissionsProvider } from "../components/admin/SubmissionsContext";
import ButtonLabel from "../components/form/ButtonLabel";
import { Spinner } from "../components/icons";
import { signOutAdmin, useAdminAuth } from "../lib/auth";
import AdminLogin from "./AdminLogin";

// /admin 守門：未登入顯示登入頁；非管理員顯示無權限並登出
export default function AdminLayout() {
  const auth = useAdminAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-stone-500">
        <Spinner className="size-5" /> 載入中 <span className="text-sm">· Wird geladen …</span>
      </div>
    );
  }
  if (auth.status === "signedOut") return <AdminLogin deniedEmail={auth.deniedEmail} />;

  return (
    <SubmissionsProvider>
      <div className="min-h-dvh">
        <header className="border-b border-stone-200 bg-white print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
            <Link to="/admin" className="flex min-h-11 flex-col justify-center">
              <span className="font-bold text-stone-900">按摩體驗回饋 · 後台</span>
              <span className="text-xs text-stone-500">Massage-Feedback · Verwaltung</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-stone-500 sm:inline">{auth.user.email}</span>
              <button
                type="button"
                onClick={() => void signOutAdmin()}
                className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100"
              >
                <ButtonLabel text={{ zh: "登出", de: "Abmelden" }} />
              </button>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </SubmissionsProvider>
  );
}
