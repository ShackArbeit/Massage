import type { InputHTMLAttributes, Ref } from "react";
import type { DateQuestion, EmailQuestion, NumberQuestion, TextQuestion } from "../../survey/questions";
import { todayISO } from "../../survey/schema";
import { inputClass } from "./inputStyles";

type Props = {
  q: TextQuestion | NumberQuestion | EmailQuestion | DateQuestion;
  inputId: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
  invalid: boolean;
  describedBy?: string;
};

function typeProps(q: Props["q"]): InputHTMLAttributes<HTMLInputElement> {
  switch (q.type) {
    case "text":
      return { type: "text", maxLength: q.maxLength, autoComplete: q.key === "name" ? "name" : "off" };
    case "number":
      return { type: "text", inputMode: "numeric", pattern: "[0-9]*", maxLength: 3, placeholder: `${q.min}–${q.max}` };
    case "email":
      return { type: "email", inputMode: "email", autoComplete: "email", placeholder: "name@example.com" };
    case "date":
      return { type: "date", max: q.notAfterToday ? todayISO() : undefined };
  }
}

export default function TextInput({ q, inputId, value, onChange, onBlur, inputRef, invalid, describedBy }: Props) {
  return (
    <input
      id={inputId}
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(q.type === "number" ? e.target.value.replace(/\D/g, "") : e.target.value)}
      onBlur={onBlur}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      aria-required={q.required}
      className={`${inputClass(invalid)} h-12 ${q.type === "number" ? "max-w-32" : ""} ${q.type === "date" ? "max-w-56 appearance-none" : ""}`}
      {...typeProps(q)}
    />
  );
}
