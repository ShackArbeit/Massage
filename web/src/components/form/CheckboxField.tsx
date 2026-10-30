import type { Bi, CheckboxQuestion } from "../../survey/questions";
import { CheckIcon } from "../icons";
import BilingualLabel from "./BilingualLabel";
import ErrorText from "./ErrorText";
import { NumberBadge } from "./FieldShell";

type Props = {
  q: CheckboxQuestion;
  number: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onBlur: () => void;
  error?: Bi;
};

export default function CheckboxField({ q, number, checked, onChange, onBlur, error }: Props) {
  const errorId = `${q.key}-error`;
  return (
    <div id={`q-${q.key}`} className="scroll-mt-32 py-3">
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-600 ${
          checked ? "border-teal-600 bg-teal-50" : error ? "border-red-400 bg-white" : "border-stone-200 bg-white"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-required={q.required}
          className="sr-only"
        />
        <NumberBadge number={number} />
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${
            checked ? "border-teal-600 bg-teal-600 text-white" : "border-stone-300 bg-white text-transparent"
          }`}
        >
          <CheckIcon className="size-4" />
        </span>
        <BilingualLabel text={q.label} className="flex-1 [&>span:first-child]:text-[15px]" />
        {q.required && (
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <ErrorText id={errorId} message={error} />
    </div>
  );
}
