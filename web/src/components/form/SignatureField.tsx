import { useState } from "react";
import type { Bi, SignatureQuestion } from "../../survey/questions";
import SignatureModal from "../SignatureModal";
import ButtonLabel from "./ButtonLabel";
import FieldShell from "./FieldShell";

type Props = {
  q: SignatureQuestion;
  number: string;
  value: string;
  onChange: (dataUrl: string) => void;
  error?: Bi;
};

export default function SignatureField({ q, number, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <FieldShell q={q} number={number} error={error}>
      <div
        className={`flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 ${
          value ? "border-stone-200 bg-white" : error ? "border-dashed border-red-300" : "border-dashed border-stone-300"
        }`}
      >
        {value ? (
          <img src={value} alt="您的簽名 Ihre Unterschrift" className="max-h-28 max-w-full" />
        ) : (
          <p className="text-center text-sm text-stone-500">
            尚未簽名
            <br />
            <span lang="de" className="text-xs">
              Noch nicht unterschrieben
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-describedby={error ? `${q.key}-error` : undefined}
          className={`inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-medium ${
            value
              ? "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              : "bg-teal-600 text-white shadow-sm hover:bg-teal-700"
          }`}
        >
          <ButtonLabel text={value ? { zh: "重新簽名", de: "Neu unterschreiben" } : { zh: "簽名", de: "Unterschrift" }} />
        </button>
      </div>
      <SignatureModal
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={(dataUrl) => {
          onChange(dataUrl);
          setOpen(false);
        }}
      />
    </FieldShell>
  );
}
