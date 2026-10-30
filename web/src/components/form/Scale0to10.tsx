import type { Scale10Question } from "../../survey/questions";
import BilingualLabel from "./BilingualLabel";

type Props = {
  q: Scale10Question;
  value: number | null;
  onChange: (n: number) => void;
  onBlur: () => void;
};

const POINTS = Array.from({ length: 11 }, (_, i) => i);

// 0–10 量表（推薦度）：手機兩列、桌機一列
export default function Scale0to10({ q, value, onChange, onBlur }: Props) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {POINTS.map((n) => {
          const checked = value === n;
          return (
            <label
              key={n}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-lg border text-base font-semibold tabular-nums transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-600 ${
                checked ? "border-teal-600 bg-teal-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name={q.key}
                value={n}
                checked={checked}
                onChange={() => onChange(n)}
                onBlur={onBlur}
                className="sr-only"
              />
              {n}
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-4">
        <BilingualLabel text={{ zh: `0 ${q.minLabel.zh}`, de: q.minLabel.de }} size="sm" />
        <BilingualLabel text={{ zh: `10 ${q.maxLabel.zh}`, de: q.maxLabel.de }} size="sm" className="items-end text-right" />
      </div>
    </div>
  );
}
