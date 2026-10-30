import { Link } from "react-router-dom";
import BilingualLabel from "../components/form/BilingualLabel";
import { CheckIcon } from "../components/icons";

export default function ThanksPage() {
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
        <div className="mt-4 space-y-1 text-sm text-stone-600">
          <p>您的回饋對我的職業培訓申請非常重要。現在可以關閉此頁面。</p>
          <p lang="de" className="text-stone-500">
            Ihr Feedback ist für meine Ausbildungsbewerbung sehr wertvoll. Sie können diese Seite jetzt schließen.
          </p>
        </div>
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
