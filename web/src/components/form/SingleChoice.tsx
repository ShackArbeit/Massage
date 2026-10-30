import type { SingleQuestion } from "../../survey/questions";
import OptionCard, { gridClass } from "./OptionCard";

type Props = {
  q: SingleQuestion;
  value: string;
  onChange: (code: string) => void;
  onBlur: () => void;
};

export default function SingleChoice({ q, value, onChange, onBlur }: Props) {
  return (
    <div className={gridClass(q.options)}>
      {q.options.map((o) => (
        <OptionCard
          key={o.code}
          kind="radio"
          name={q.key}
          value={o.code}
          label={o.label}
          checked={value === o.code}
          onChange={() => onChange(o.code)}
          // 選填題可再點一次取消選取
          onClick={() => {
            if (!q.required && value === o.code) onChange("");
          }}
          onBlur={onBlur}
        />
      ))}
    </div>
  );
}
