import { Link, Navigate, useLocation } from "react-router-dom";
import BilingualLabel from "../components/form/BilingualLabel";
import { CheckIcon } from "../components/icons";

function isSubmittedState(state: unknown): boolean {
  return typeof state === "object" && state !== null && "submitted" in state && state.submitted === true;
}

export default function ThanksPage() {
  // 只有問卷送出成功後才能進入；直接輸入網址會導回問卷
  const { state } = useLocation();
  if (!isSubmittedState(state)) return <Navigate to="/" replace />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[720px] items-center px-4 py-12">
      <div className="w-full rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-50 text-teal-600 ring-8 ring-teal-50/50">
          <CheckIcon className="size-8" />
        </div>
        <h1 className="mt-6">
          <BilingualLabel
            text={{ zh: "已成功送出，謝謝您！", de: "Erfolgreich gesendet – vielen Dank!" }}
            size="lg"
            className="items-center"
          />
        </h1>
        <Link
          to="/"
          replace
          className="mt-8 inline-flex min-h-11 items-center rounded-xl px-4 text-sm text-stone-500 hover:bg-stone-100"
        >
          返回問卷首頁 <span className="ml-1 text-xs">· Zurück zum Fragebogen</span>
        </Link>
      </div>
    </main>
  );
}
