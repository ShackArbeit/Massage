import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AnswerView from "../components/admin/AnswerView";
import { useSubmissions } from "../components/admin/SubmissionsContext";
import ConfirmDialog from "../components/ConfirmDialog";
import BilingualLabel from "../components/form/BilingualLabel";
import ButtonLabel from "../components/form/ButtonLabel";
import { NumberBadge } from "../components/form/FieldShell";
import { Spinner } from "../components/icons";
import PrintSheet from "../components/print/PrintSheet";
import { todayISO } from "../survey/schema";
import type { StoredSubmission } from "../lib/submissions";
import { answeredQuestions, formatTimestamp, shortId, type Answer } from "../survey/answers";
import { sections, type Bi } from "../survey/questions";

function CommentView({ answer }: { answer: Extract<Answer, { kind: "comment" }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl bg-teal-50/60 p-3 ring-1 ring-teal-100">
        <p className="mb-1 flex items-center justify-between text-xs text-stone-500">
          <span>德文 · Deutsch</span>
          {answer.edited && <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-stone-200">使用者已修改 · bearbeitet</span>}
        </p>
        <p lang="de" className="whitespace-pre-wrap text-stone-900">
          {answer.de}
        </p>
      </div>
      <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
        <p className="mb-1 text-xs text-stone-500">中文原文 · Chinesisches Original</p>
        <p lang="zh-Hant" className="whitespace-pre-wrap text-stone-900">
          {answer.zh}
        </p>
      </div>
    </div>
  );
}

function SubmissionView({ sub }: { sub: StoredSubmission }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-2xl font-bold text-stone-900">{sub.name}</h1>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-stone-500">提交編號 · Nr.</dt>
            <dd className="font-mono tabular-nums">
              {shortId(sub.id)} <span className="text-xs text-stone-400">({sub.id})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">提交時間 · Eingang</dt>
            <dd className="tabular-nums">{formatTimestamp(sub.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {sections.map((section) => {
        const rows = answeredQuestions(sub, section);
        if (rows.length === 0) return null;
        return (
          <section key={section.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <h2 className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 font-semibold text-white">{section.id}</span>
              <BilingualLabel text={section.title} />
            </h2>
            <dl className="mt-3 divide-y divide-stone-100">
              {rows.map(({ q, number, answer }) =>
                answer.kind === "comment" ? (
                  <div key={q.key} className="py-3">
                    <dt className="mb-2 flex items-start gap-2.5">
                      <NumberBadge number={number} />
                      <BilingualLabel text={q.label} size="sm" />
                    </dt>
                    <dd>
                      <CommentView answer={answer} />
                    </dd>
                  </div>
                ) : (
                  <div key={q.key} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                    <dt className="flex items-start gap-2.5">
                      <NumberBadge number={number} />
                      <BilingualLabel text={q.label} size="sm" />
                    </dt>
                    <dd className="pl-9 sm:pl-0">
                      <AnswerView answer={answer} />
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

export default function AdminDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state, remove } = useSubmissions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Bi>();

  const sub = state.status === "ready" ? state.items.find((s) => s.id === id) : undefined;

  async function doDelete() {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await remove(id);
      navigate("/admin", { replace: true });
    } catch {
      setDeleteError({ zh: "刪除失敗，請再試一次。", de: "Löschen fehlgeschlagen. Bitte erneut versuchen." });
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to="/admin" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">
          ← <ButtonLabel text={{ zh: "返回列表", de: "Zurück zur Übersicht" }} />
        </Link>
        {sub && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-xl bg-teal-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              <ButtonLabel text={{ zh: "列印", de: "Drucken" }} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="min-h-11 rounded-xl border border-red-300 bg-white px-4 text-sm text-red-700 hover:bg-red-50"
            >
              <ButtonLabel text={{ zh: "刪除", de: "Löschen" }} />
            </button>
          </div>
        )}
      </div>

      {state.status === "loading" && (
        <p className="mt-10 flex items-center justify-center gap-2 text-stone-500">
          <Spinner className="size-5" /> 載入中 <span className="text-sm">· Wird geladen …</span>
        </p>
      )}
      {state.status === "error" && (
        <p className="mt-10 text-center text-red-700">
          載入失敗 <span className="text-sm">· Laden fehlgeschlagen</span>
        </p>
      )}
      {state.status === "ready" && !sub && (
        <p className="mt-10 text-center text-stone-500">
          找不到這筆資料 <span className="text-sm">· Eintrag nicht gefunden</span>
        </p>
      )}
      {sub && (
        <>
          <div className="print:hidden">
            <SubmissionView sub={sub} />
          </div>
          <div className="hidden print:block">
            <PrintSheet sub={sub} printDate={todayISO()} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={{ zh: "確定要刪除這筆資料嗎？", de: "Diesen Eintrag wirklich löschen?" }}
        message={{
          zh: `將永久刪除「${sub?.name ?? ""}」的回饋與簽名，此動作無法復原。`,
          de: `Das Feedback und die Unterschrift von „${sub?.name ?? ""}“ werden endgültig gelöscht. Dies kann nicht rückgängig gemacht werden.`,
        }}
        confirmLabel={{ zh: "永久刪除", de: "Endgültig löschen" }}
        busy={deleting}
        error={deleteError}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
      />
    </main>
  );
}
