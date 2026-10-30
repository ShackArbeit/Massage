import { RATING_LABELS, type RatingQuestion } from "../../survey/questions";
import BilingualLabel from "./BilingualLabel";

type Props = {
  q: RatingQuestion;
  value: number | null;
  onChange: (n: number) => void;
  onBlur: () => void;
};

const SCORES = [1, 2, 3, 4, 5] as const;

export default function RatingScale({ q, value, onChange, onBlur }: Props) {
  const selected = SCORES.find((s) => s === value);
  return (
    <div>
      <div className="flex max-w-xs justify-between gap-2">
        {SCORES.map((s) => {
          const checked = value === s;
          return (
            <label
              key={s}
              className={`flex size-12 cursor-pointer items-center justify-center rounded-full border-2 text-lg font-semibold tabular-nums transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-600 ${
                checked
                  ? "border-teal-600 bg-teal-600 text-white"
                  : value !== null && s < value
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name={q.key}
                value={s}
                checked={checked}
                onChange={() => onChange(s)}
                onBlur={onBlur}
                className="sr-only"
              />
              <span aria-hidden="true">{s}</span>
              <span className="sr-only">
                {s} – {RATING_LABELS[s].zh} {RATING_LABELS[s].de}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-2 min-h-10" aria-live="polite">
        {selected ? (
          <BilingualLabel text={RATING_LABELS[selected]} size="sm" className="[&>span:first-child]:font-medium [&>span:first-child]:text-teal-700" />
        ) : (
          <BilingualLabel text={{ zh: "請選擇分數", de: "Bitte wählen" }} size="sm" className="opacity-60" />
        )}
      </div>
    </div>
  );
}
