import { useState, type Ref } from "react";
import { logTranslateError, translateErrorMessage, translateOne } from "../../lib/translate";
import { emptyComment, type Bi, type CommentQuestion, type CommentValue } from "../../survey/questions";
import { AlertIcon, Spinner } from "../icons";
import BilingualLabel from "./BilingualLabel";
import ButtonLabel from "./ButtonLabel";
import ErrorText from "./ErrorText";
import { inputClass } from "./inputStyles";

type Props = {
  q: CommentQuestion;
  inputId: string;
  value: CommentValue;
  onChange: (v: CommentValue) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLTextAreaElement>;
  invalid: boolean;
  describedBy?: string;
};

export default function TextAreaWithTranslate({ q, inputId, value, onChange, onBlur, inputRef, invalid, describedBy }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Bi | undefined>();

  const hasZh = value.zh.trim() !== "";
  const hasPreview = value.translatedFrom !== null;
  const stale = hasPreview && value.translatedFrom !== value.zh;

  async function translate() {
    setBusy(true);
    setError(undefined);
    try {
      const de = await translateOne(q.key, value.zh.trim());
      onChange({ zh: value.zh, de, deEditedByUser: false, translatedFrom: value.zh });
    } catch (e) {
      logTranslateError(e, q.key);
      setError(translateErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <textarea
        id={inputId}
        ref={inputRef}
        lang="zh-Hant"
        rows={4}
        maxLength={q.maxLength}
        value={value.zh}
        readOnly={busy}
        onChange={(e) => {
          const zh = e.target.value;
          // 中文清空時一併清除德文
          onChange(zh.trim() === "" ? emptyComment() : { ...value, zh });
        }}
        onBlur={onBlur}
        placeholder="請用中文填寫… / Bitte auf Chinesisch schreiben …"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-required={q.required}
        className={`${inputClass(invalid)} resize-y py-3 leading-relaxed`}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={translate}
          disabled={!hasZh || busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {busy && <Spinner />}
          <ButtonLabel
            text={
              busy
                ? { zh: "翻譯中…", de: "Wird übersetzt …" }
                : hasPreview
                  ? { zh: "重新翻譯", de: "Neu übersetzen" }
                  : { zh: "翻成德文", de: "Ins Deutsche übersetzen" }
            }
          />
        </button>
        <span className="text-xs tabular-nums text-stone-400">
          {value.zh.length} / {q.maxLength}
        </span>
      </div>
      <ErrorText id={`${q.key}-translate-error`} message={error} />

      {hasPreview && (
        <div className={`mt-3 rounded-xl border p-3 ${stale ? "border-amber-300 bg-amber-50" : "border-teal-200 bg-teal-50/50"}`}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <label htmlFor={`${inputId}-de`}>
              <BilingualLabel text={{ zh: "德文預覽（可修改）", de: "Deutsche Vorschau (bearbeitbar)" }} size="sm" />
            </label>
            {value.deEditedByUser && !stale && (
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs text-stone-600 ring-1 ring-stone-200">
                已修改 · bearbeitet
              </span>
            )}
          </div>
          {stale && (
            <p className="mb-2 flex gap-1.5 text-sm text-amber-800">
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              <span className="flex flex-col">
                <span>中文已修改，德文已過期，請重新翻譯。</span>
                <span lang="de" className="text-xs">
                  Der chinesische Text wurde geändert – bitte erneut übersetzen.
                </span>
              </span>
            </p>
          )}
          <textarea
            id={`${inputId}-de`}
            lang="de"
            rows={4}
            value={value.de}
            readOnly={busy}
            onChange={(e) => onChange({ ...value, de: e.target.value, deEditedByUser: true })}
            className={`${inputClass(false)} resize-y py-3 leading-relaxed ${stale ? "text-stone-500" : ""}`}
          />
        </div>
      )}
    </div>
  );
}
