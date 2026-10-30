import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Bi } from "../survey/questions";
import BilingualLabel from "./form/BilingualLabel";
import ButtonLabel from "./form/ButtonLabel";
import { Spinner } from "./icons";

type Props = {
  open: boolean;
  title: Bi;
  message: Bi;
  confirmLabel: Bi;
  busy?: boolean;
  error?: Bi;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel, busy, error, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-title">
          <BilingualLabel text={title} />
        </h2>
        <div id="confirm-message" className="mt-3">
          <BilingualLabel text={message} size="sm" className="[&>span:first-child]:text-stone-700" />
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.zh} <span className="text-xs">· {error.de}</span>
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            <ButtonLabel text={{ zh: "取消", de: "Abbrechen" }} />
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy && <Spinner />}
            <ButtonLabel text={confirmLabel} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
