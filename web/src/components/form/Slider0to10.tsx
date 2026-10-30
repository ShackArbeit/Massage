import type { SliderQuestion } from "../../survey/questions";
import BilingualLabel from "./BilingualLabel";

type Props = {
  q: SliderQuestion;
  inputId: string;
  value: number | null;
  onChange: (n: number | null) => void;
  onBlur: () => void;
};

export default function Slider0to10({ q, inputId, value, onChange, onBlur }: Props) {
  const has = value !== null;
  return (
    <div>
      <div className="mb-1 flex min-h-11 items-center justify-between">
        <output htmlFor={inputId} className="text-3xl font-semibold tabular-nums text-teal-700">
          {has ? value : <span className="text-stone-300">–</span>}
          <span className="ml-1 text-sm font-normal text-stone-400">/ 10</span>
        </output>
        {has && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-11 rounded-lg px-3 text-sm text-stone-500 hover:bg-stone-100"
          >
            清除 <span className="text-xs">Zurücksetzen</span>
          </button>
        )}
      </div>
      <input
        id={inputId}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        // 尚未填寫時，點在目前位置（0）也要算填寫
        onPointerUp={(e) => {
          if (!has) onChange(Number(e.currentTarget.value));
        }}
        onBlur={onBlur}
        aria-valuetext={has ? String(value) : "未填 nicht angegeben"}
        className={`h-11 w-full cursor-pointer ${has ? "accent-teal-600" : "accent-stone-400 opacity-60"}`}
      />
      <div className="mt-1 flex justify-between gap-4 text-left">
        <BilingualLabel text={{ zh: `0 ${q.minLabel.zh}`, de: q.minLabel.de }} size="sm" />
        <BilingualLabel text={{ zh: `10 ${q.maxLabel.zh}`, de: q.maxLabel.de }} size="sm" className="items-end text-right" />
      </div>
      {!has && (
        <p className="mt-2 text-xs text-stone-500">
          尚未選擇，請拖動或點選滑桿 · <span lang="de">Noch nicht gewählt – bitte Regler bewegen</span>
        </p>
      )}
    </div>
  );
}
