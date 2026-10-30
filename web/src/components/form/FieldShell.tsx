import type { ReactNode } from "react";
import type { Bi, Question } from "../../survey/questions";
import BilingualLabel from "./BilingualLabel";
import ErrorText from "./ErrorText";

type Props = {
  q: Question;
  number: string;
  error?: Bi;
  /** 有值時用 <label htmlFor>；否則以 fieldset/legend 包住選項群組 */
  inputId?: string;
  children: ReactNode;
};

export function NumberBadge({ number }: { number: string }) {
  return (
    <span className="mt-0.5 inline-flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md bg-stone-100 px-1.5 text-xs font-semibold tabular-nums text-stone-600">
      {number}
    </span>
  );
}

function Heading({ q, number }: { q: Question; number: string }) {
  return (
    <span className="flex items-start gap-2.5">
      <NumberBadge number={number} />
      <span className="flex-1">
        <BilingualLabel text={q.label} />
        {q.hint && <BilingualLabel text={q.hint} size="sm" className="mt-1 opacity-80" />}
      </span>
      {q.required && (
        <span className="shrink-0 text-red-600">
          <span aria-hidden="true">*</span>
          <span className="sr-only">必填 Pflichtfeld</span>
        </span>
      )}
    </span>
  );
}

export default function FieldShell({ q, number, error, inputId, children }: Props) {
  const errorId = `${q.key}-error`;
  if (inputId) {
    return (
      <div id={`q-${q.key}`} className="scroll-mt-32 py-4">
        <label htmlFor={inputId} className="mb-3 block">
          <Heading q={q} number={number} />
        </label>
        {children}
        <ErrorText id={errorId} message={error} />
      </div>
    );
  }
  return (
    <fieldset id={`q-${q.key}`} className="scroll-mt-32 py-4" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-3 block w-full">
        <Heading q={q} number={number} />
      </legend>
      {children}
      <ErrorText id={errorId} message={error} />
    </fieldset>
  );
}
