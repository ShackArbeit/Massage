import type { Bi } from "../../survey/questions";

// 按鈕內的中德並列文字
export default function ButtonLabel({ text }: { text: Bi }) {
  return (
    <span className="flex flex-col items-center leading-tight">
      <span lang="zh-Hant">{text.zh}</span>
      <span lang="de" className="text-xs opacity-80">
        {text.de}
      </span>
    </span>
  );
}
