import type { Bi } from "../../survey/questions";
import { AlertIcon, Spinner } from "../icons";
import ButtonLabel from "./ButtonLabel";

export type MissingItem = { key: string; number: string; label: Bi };

type Props = {
  missing: MissingItem[];
  onJump: (key: string) => void;
  submitting: boolean;
  status?: { kind: "success" | "error"; message: Bi };
};

export default function SubmitBar({ missing, onJump, submitting, status }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto max-w-[720px] px-4 py-3">
        {missing.length > 0 && (
          <details className="group mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2">
              <AlertIcon className="size-4 shrink-0" />
              <span>
                尚缺 {missing.length} 項 <span lang="de" className="text-xs">· Noch {missing.length} Angabe(n) offen</span>
              </span>
              <span className="ml-auto text-xs underline group-open:hidden">查看 · anzeigen</span>
            </summary>
            <ul className="mt-1 max-h-40 overflow-y-auto">
              {missing.map((m) => (
                <li key={m.key}>
                  <button
                    type="button"
                    onClick={() => onJump(m.key)}
                    className="flex min-h-10 w-full items-center gap-2 rounded-lg px-1 text-left hover:bg-red-100"
                  >
                    <span className="w-8 shrink-0 text-xs font-semibold tabular-nums">{m.number}</span>
                    <span className="flex flex-col leading-tight">
                      <span>{m.label.zh}</span>
                      <span lang="de" className="text-xs text-red-700/80">
                        {m.label.de}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
        {status && (
          <p
            role="status"
            className={`mb-2 rounded-xl px-3 py-2 text-sm ${status.kind === "success" ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-800"}`}
          >
            {status.message.zh} <span lang="de" className="text-xs">· {status.message.de}</span>
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-wait disabled:bg-teal-600/60"
        >
          {submitting && <Spinner className="size-5" />}
          <ButtonLabel text={submitting ? { zh: "送出中…", de: "Wird gesendet …" } : { zh: "送出", de: "Absenden" }} />
        </button>
      </div>
    </div>
  );
}
