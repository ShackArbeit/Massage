import type { Bi } from "../../survey/questions";

type Size = "lg" | "md" | "sm";

const ZH: Record<Size, string> = {
  lg: "text-xl font-bold",
  md: "text-base font-medium",
  sm: "text-sm",
};
const DE: Record<Size, string> = {
  lg: "text-sm",
  md: "text-sm",
  sm: "text-xs",
};

// 中文為主行（深色、較大），德文為副行（灰色、較小），上下堆疊
export default function BilingualLabel({ text, size = "md", className = "" }: { text: Bi; size?: Size; className?: string }) {
  return (
    <span className={`flex flex-col ${className}`}>
      <span lang="zh-Hant" className={`${ZH[size]} text-stone-900`}>
        {text.zh}
      </span>
      <span lang="de" className={`${DE[size]} leading-snug text-stone-500`}>
        {text.de}
      </span>
    </span>
  );
}
