import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SignaturePad from "signature_pad";
import { compressSignature } from "../lib/image";
import BilingualLabel from "./form/BilingualLabel";
import ButtonLabel from "./form/ButtonLabel";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

export default function SignatureModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return createPortal(<SignatureDialog onCancel={onCancel} onConfirm={onConfirm} />, document.body);
}

function SignatureDialog({ onCancel, onConfirm }: Omit<Props, "open">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [empty, setEmpty] = useState(true);

  // 建立畫布：依 devicePixelRatio 調整解析度，白底黑筆
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(0,0,0)",
      minWidth: 1,
      maxWidth: 3,
    });
    padRef.current = pad;

    const resize = () => {
      const data = pad.toData();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      pad.fromData(data); // 轉向或視窗大小改變時保留筆跡
    };
    const onEnd = () => setEmpty(pad.isEmpty());

    resize();
    pad.addEventListener("endStroke", onEnd);
    window.addEventListener("resize", resize);
    return () => {
      pad.removeEventListener("endStroke", onEnd);
      window.removeEventListener("resize", resize);
      pad.off();
      padRef.current = null;
    };
  }, []);

  // 鎖住背景捲動、Esc 關閉
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  function clear() {
    padRef.current?.clear();
    setEmpty(true);
  }

  function confirm() {
    const canvas = canvasRef.current;
    if (!canvas || !padRef.current || padRef.current.isEmpty()) return;
    onConfirm(compressSignature(canvas));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-stone-900/60 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-title"
        tabIndex={-1}
        className="flex h-full w-full flex-col bg-white outline-none sm:h-auto sm:max-w-2xl sm:rounded-2xl sm:shadow-xl"
      >
        <header className="border-b border-stone-200 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <h2 id="signature-title">
            <BilingualLabel text={{ zh: "請在下方簽名", de: "Bitte unten unterschreiben" }} />
          </h2>
          <p className="mt-1 text-xs text-stone-500 sm:hidden">
            手機可橫放以便簽名 · <span lang="de">Querformat empfohlen</span>
          </p>
        </header>

        <div className="flex flex-1 flex-col p-4 sm:flex-none">
          <div className="relative min-h-56 flex-1 rounded-xl border-2 border-dashed border-stone-300 sm:h-72 sm:flex-none">
            <canvas
              ref={canvasRef}
              aria-label="簽名區 Unterschriftsfeld"
              className="absolute inset-0 h-full w-full touch-none rounded-xl"
            />
            {/* 簽名基準線（不會出現在輸出圖中） */}
            <div className="pointer-events-none absolute inset-x-6 bottom-12 flex items-end gap-2 border-b border-stone-300 pb-1 text-stone-400">
              <span className="text-lg">✕</span>
            </div>
            {empty && (
              <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-stone-400">
                請用手指或滑鼠簽名
                <br />
                <span lang="de" className="text-xs">
                  Mit Finger oder Maus unterschreiben
                </span>
              </p>
            )}
          </div>
        </div>

        <footer className="grid grid-cols-3 gap-2 border-t border-stone-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={clear}
            disabled={empty}
            className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-40"
          >
            <ButtonLabel text={{ zh: "清除", de: "Löschen" }} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700 hover:bg-stone-50"
          >
            <ButtonLabel text={{ zh: "取消", de: "Abbrechen" }} />
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={empty}
            className="min-h-12 rounded-xl bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-stone-300"
          >
            <ButtonLabel text={{ zh: "確認", de: "Bestätigen" }} />
          </button>
        </footer>
      </div>
    </div>
  );
}
