import type { Answer } from "../../survey/answers";
import BilingualLabel from "../form/BilingualLabel";
import { CheckIcon } from "../icons";
import RatingDots from "./RatingDots";

// 非意見題的答案呈現（意見題在詳細頁以中德並列另行呈現）
export default function AnswerView({ answer }: { answer: Answer }) {
  switch (answer.kind) {
    case "text":
    case "date":
      return <span className="text-stone-900">{answer.text}</span>;
    case "options":
      return (
        <div className="flex flex-col gap-1.5">
          <ul className="flex flex-wrap gap-1.5">
            {answer.options.map((o) => (
              <li key={o.zh + o.de} className="rounded-lg bg-teal-50 px-2.5 py-1 ring-1 ring-teal-100">
                <BilingualLabel text={o} size="sm" />
              </li>
            ))}
          </ul>
          {answer.other && (
            <p className="text-sm text-stone-700">
              其他說明 <span className="text-xs text-stone-500">Sonstiges</span>：{answer.other}
            </p>
          )}
        </div>
      );
    case "rating":
      return (
        <span className="flex items-center gap-3">
          <RatingDots value={answer.value} />
          <span className="text-sm tabular-nums text-stone-900">
            {answer.value} · {answer.label.zh} <span className="text-xs text-stone-500">{answer.label.de}</span>
          </span>
        </span>
      );
    case "scale":
      return (
        <span className="tabular-nums text-stone-900">
          <span className="text-lg font-semibold">{answer.value}</span>
          <span className="text-sm text-stone-500"> / 10</span>
        </span>
      );
    case "check":
      return (
        <span className="inline-flex items-center gap-2 text-sm text-teal-700">
          <span className="flex size-5 items-center justify-center rounded bg-teal-600 text-white">
            <CheckIcon className="size-3.5" />
          </span>
          已勾選 <span className="text-xs text-stone-500">bestätigt</span>
        </span>
      );
    case "signature":
      return <img src={answer.src} alt="簽名 Unterschrift" className="max-h-32 max-w-full rounded-lg bg-white ring-1 ring-stone-200" />;
    case "comment":
      return null;
  }
}
