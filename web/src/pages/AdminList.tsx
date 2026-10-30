import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RatingDots from "../components/admin/RatingDots";
import { useSubmissions } from "../components/admin/SubmissionsContext";
import BilingualLabel from "../components/form/BilingualLabel";
import ButtonLabel from "../components/form/ButtonLabel";
import { inputClass } from "../components/form/inputStyles";
import { Spinner } from "../components/icons";
import PrintSheet from "../components/print/PrintSheet";
import { downloadCsv } from "../lib/csv";
import type { StoredSubmission } from "../lib/submissions";
import { formatTimestamp, optionText } from "../survey/answers";
import { findQuestion, type Bi } from "../survey/questions";
import { todayISO } from "../survey/schema";

type SortKey = "createdDesc" | "createdAsc" | "dateDesc" | "dateAsc" | "ratingDesc" | "ratingAsc";

const SORTS: { key: SortKey; label: Bi; compare: (a: StoredSubmission, b: StoredSubmission) => number }[] = [
  { key: "createdDesc", label: { zh: "提交時間（新→舊）", de: "Eingang (neu → alt)" }, compare: (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis() },
  { key: "createdAsc", label: { zh: "提交時間（舊→新）", de: "Eingang (alt → neu)" }, compare: (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis() },
  { key: "dateDesc", label: { zh: "體驗日期（新→舊）", de: "Massagedatum (neu → alt)" }, compare: (a, b) => b.massageDate.localeCompare(a.massageDate) },
  { key: "dateAsc", label: { zh: "體驗日期（舊→新）", de: "Massagedatum (alt → neu)" }, compare: (a, b) => a.massageDate.localeCompare(b.massageDate) },
  { key: "ratingDesc", label: { zh: "整體評分（高→低）", de: "Gesamtbewertung (hoch → niedrig)" }, compare: (a, b) => b.ratings.overall - a.ratings.overall },
  { key: "ratingAsc", label: { zh: "整體評分（低→高）", de: "Gesamtbewertung (niedrig → hoch)" }, compare: (a, b) => a.ratings.overall - b.ratings.overall },
];

const MASSAGE_TYPE = findQuestion("massageType");
const RELATIONSHIP = findQuestion("relationship");

function Cell({ text }: { text?: Bi }) {
  return text ? <BilingualLabel text={text} size="sm" className="[&>span:first-child]:text-stone-800" /> : <span>–</span>;
}

export default function AdminList() {
  const { state, reload } = useSubmissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("createdDesc");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const items = state.status === "ready" ? state.items : [];
  const sorted = useMemo(() => {
    const compare = SORTS.find((s) => s.key === sort)?.compare;
    return compare ? [...items].sort(compare) : items;
  }, [items, sort]);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? sorted.filter((s) => s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term))
      : sorted;
  }, [sorted, search]);
  // 依目前排序；搜尋條件改變時，已勾選但未顯示的項目仍保留
  const selectedItems = useMemo(() => sorted.filter((s) => selected.has(s.id)), [sorted, selected]);
  const allShownSelected = shown.length > 0 && shown.every((s) => selected.has(s.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAllShown() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of shown) {
        if (allShownSelected) next.delete(s.id);
        else next.add(s.id);
      }
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">
      {/* 批次列印：只印勾選的資料，每筆從新的一頁開始 */}
      {selectedItems.length > 0 && (
        <div className="hidden print:block">
          {selectedItems.map((s) => (
            <PrintSheet key={s.id} sub={s} printDate={todayISO()} />
          ))}
        </div>
      )}
      <div className={selectedItems.length > 0 ? "print:hidden" : ""}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1>
          <BilingualLabel text={{ zh: "回饋列表", de: "Übersicht der Rückmeldungen" }} size="lg" />
        </h1>
        {state.status === "ready" && (
          <p className="text-sm text-stone-600" aria-live="polite">
            共 <span className="font-semibold tabular-nums">{items.length}</span> 筆
            {search && (
              <>
                ，符合 <span className="font-semibold tabular-nums">{shown.length}</span> 筆
              </>
            )}
            <span className="ml-1 text-xs text-stone-500">
              · {items.length} Einträge{search && `, ${shown.length} Treffer`}
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs text-stone-500">搜尋姓名或 Email · Suche nach Name oder E-Mail</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass(false)} h-11`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-500">排序 · Sortierung</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={`${inputClass(false)} h-11 pr-8`}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label.zh} · {s.label.de}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.status === "ready" && items.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm text-stone-700 hover:bg-stone-100">
            <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} className="size-5 accent-teal-600" />
            全選 <span className="text-xs text-stone-500">Alle auswählen</span>
          </label>
          <span className="text-sm text-stone-600" aria-live="polite">
            已選 <span className="font-semibold tabular-nums">{selectedItems.length}</span> 筆
            <span className="ml-1 text-xs text-stone-500">· {selectedItems.length} ausgewählt</span>
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={selectedItems.length === 0}
              className="min-h-11 rounded-xl bg-teal-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <ButtonLabel text={{ zh: "列印所選", de: "Auswahl drucken" }} />
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(selectedItems, `massage-feedback-${todayISO()}.csv`)}
              disabled={selectedItems.length === 0}
              className="min-h-11 rounded-xl border border-teal-600 bg-white px-4 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400"
            >
              <ButtonLabel text={{ zh: "匯出 CSV", de: "CSV exportieren" }} />
            </button>
          </div>
        </div>
      )}

      {state.status === "loading" && (
        <p className="mt-10 flex items-center justify-center gap-2 text-stone-500">
          <Spinner className="size-5" /> 載入中 <span className="text-sm">· Wird geladen …</span>
        </p>
      )}

      {state.status === "error" && (
        <div className="mt-10 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
          <p>
            載入失敗 <span className="text-xs">· Laden fehlgeschlagen</span>
          </p>
          <button type="button" onClick={reload} className="mt-3 min-h-11 rounded-xl bg-white px-4 ring-1 ring-red-200 hover:bg-red-100">
            <ButtonLabel text={{ zh: "重新載入", de: "Erneut laden" }} />
          </button>
        </div>
      )}

      {state.status === "ready" && shown.length === 0 && (
        <p className="mt-10 text-center text-stone-500">
          {items.length === 0 ? "目前還沒有資料 · Noch keine Einträge" : "沒有符合的資料 · Keine Treffer"}
        </p>
      )}

      {state.status === "ready" && shown.length > 0 && (
        <>
          {/* 桌機：表格 */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs text-stone-600">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <span className="sr-only">選取 Auswahl</span>
                  </th>
                  {[
                    ["提交時間", "Eingang"],
                    ["姓名", "Name"],
                    ["體驗日期", "Massagedatum"],
                    ["按摩類型", "Art der Massage"],
                    ["整體評分", "Gesamt"],
                    ["關係", "Beziehung"],
                  ].map(([zh, de]) => (
                    <th key={zh} scope="col" className="px-4 py-3 font-medium">
                      {zh}
                      <span className="block font-normal text-stone-400">{de}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {shown.map((s) => (
                  <tr key={s.id} onClick={() => navigate(`/admin/${s.id}`)} className="cursor-pointer hover:bg-teal-50/50">
                    <td className="p-0" onClick={(e) => e.stopPropagation()}>
                      <label className="flex min-h-11 cursor-pointer items-center justify-center px-4">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          aria-label={`選取 Auswählen: ${s.name}`}
                          className="size-5 accent-teal-600"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-600">{formatTimestamp(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/${s.id}`} className="font-medium text-stone-900 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {s.name}
                      </Link>
                      <span className="block text-xs text-stone-500">{s.email}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{s.massageDate}</td>
                    <td className="px-4 py-3">
                      <Cell text={optionText(MASSAGE_TYPE, s)} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <RatingDots value={s.ratings.overall} />
                        <span className="tabular-nums text-stone-600">{s.ratings.overall}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Cell text={optionText(RELATIONSHIP, s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 手機：卡片 */}
          <ul className="mt-5 space-y-3 md:hidden">
            {shown.map((s) => (
              <li key={s.id} className="flex items-start gap-1">
                <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    aria-label={`選取 Auswählen: ${s.name}`}
                    className="size-5 accent-teal-600"
                  />
                </label>
                <Link to={`/admin/${s.id}`} className="block min-w-0 flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 active:bg-teal-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{s.name}</p>
                      <p className="text-xs text-stone-500">{s.email}</p>
                    </div>
                    <RatingDots value={s.ratings.overall} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-stone-500">體驗日期 · Datum</dt>
                      <dd className="tabular-nums">{s.massageDate}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">提交時間 · Eingang</dt>
                      <dd className="tabular-nums">{formatTimestamp(s.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">按摩類型 · Art</dt>
                      <dd>{optionText(MASSAGE_TYPE, s)?.zh ?? "–"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">關係 · Beziehung</dt>
                      <dd>{optionText(RELATIONSHIP, s)?.zh ?? "–"}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </main>
  );
}
