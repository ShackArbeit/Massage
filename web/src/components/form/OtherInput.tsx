import { useController } from "react-hook-form";
import { OTHER_MAX_LENGTH, otherKeyOf, type FormValues } from "../../survey/questions";
import { messageFor } from "../../survey/schema";
import ErrorText from "./ErrorText";
import { inputClass } from "./inputStyles";

// 選「其他」時展開的文字欄（必填、最多 100 字）
export default function OtherInput({ questionKey }: { questionKey: string }) {
  const name = otherKeyOf(questionKey);
  const { field, fieldState } = useController<FormValues>({ name });
  const value = typeof field.value === "string" ? field.value : "";
  const error = messageFor(fieldState.error?.message);
  const inputId = `in-${name}`;
  const errorId = `${name}-error`;

  return (
    <div id={`q-${name}`} className="mt-3 scroll-mt-32 rounded-xl bg-stone-50 p-3">
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-stone-700">
        請說明「其他」 <span className="text-xs text-stone-500">· Bitte „Sonstiges“ angeben</span>
        <span className="text-red-600" aria-hidden="true"> *</span>
      </label>
      <input
        id={inputId}
        ref={field.ref}
        value={value}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
        maxLength={OTHER_MAX_LENGTH}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        aria-required
        className={`${inputClass(!!error)} h-12`}
      />
      <div className="mt-1 text-right text-xs tabular-nums text-stone-400">
        {value.length} / {OTHER_MAX_LENGTH}
      </div>
      <ErrorText id={errorId} message={error} />
    </div>
  );
}
