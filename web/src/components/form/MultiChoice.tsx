import type { MultiQuestion } from "../../survey/questions";
import OptionCard, { gridClass } from "./OptionCard";

type Props = {
  q: MultiQuestion;
  value: string[];
  onChange: (codes: string[]) => void;
  onBlur: () => void;
};

export default function MultiChoice({ q, value, onChange, onBlur }: Props) {
  const exclusive = new Set(q.options.filter((o) => o.exclusive).map((o) => o.code));

  function toggle(code: string) {
    if (value.includes(code)) {
      onChange(value.filter((c) => c !== code));
    } else if (exclusive.has(code)) {
      onChange([code]); // 「無」與其他選項互斥
    } else {
      onChange([...value.filter((c) => !exclusive.has(c)), code]);
    }
  }

  return (
    <div className={gridClass(q.options)}>
      {q.options.map((o) => (
        <OptionCard
          key={o.code}
          kind="checkbox"
          name={q.key}
          value={o.code}
          label={o.label}
          checked={value.includes(o.code)}
          onChange={() => toggle(o.code)}
          onBlur={onBlur}
        />
      ))}
    </div>
  );
}
