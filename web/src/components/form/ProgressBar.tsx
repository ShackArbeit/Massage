import type { Bi, SectionId } from "../../survey/questions";

export type ProgressItem = { id: SectionId; title: Bi; done: boolean; optional: boolean };

export default function ProgressBar({ items, onJump }: { items: ProgressItem[]; onJump: (id: SectionId) => void }) {
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return (
    <nav aria-label="填寫進度 Fortschritt" className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-[720px] px-4 pt-2 pb-1">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>
            填寫進度 <span lang="de">· Fortschritt</span>
          </span>
          <span className="tabular-nums">
            {done} / {required.length}
          </span>
        </div>
        <ol className="grid grid-cols-6 gap-1.5">
          {items.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => onJump(i.id)}
                aria-label={`${i.id} ${i.title.zh} ${i.title.de}${i.optional ? "（選填 freiwillig）" : i.done ? "（已完成 erledigt）" : "（未完成 offen）"}`}
                className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-md"
              >
                <span
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    i.optional ? "bg-amber-200" : i.done ? "bg-teal-600" : "bg-stone-200"
                  }`}
                />
                <span className={`text-xs font-semibold ${i.done && !i.optional ? "text-teal-700" : "text-stone-500"}`}>{i.id}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
