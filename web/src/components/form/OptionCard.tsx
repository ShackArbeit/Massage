import type { Bi } from "../../survey/questions";
import { CheckIcon } from "../icons";
import BilingualLabel from "./BilingualLabel";

type Props = {
  kind: "radio" | "checkbox";
  name: string;
  value: string;
  label: Bi;
  checked: boolean;
  onChange: () => void;
  onClick?: () => void;
  onBlur?: () => void;
};

// 單選（圓形指示）與複選（方形勾）共用的大型選項卡
export default function OptionCard({ kind, name, value, label, checked, onChange, onClick, onBlur }: Props) {
  const shape = kind === "radio" ? "rounded-full" : "rounded-[5px]";
  return (
    <label
      className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-600 ${
        checked ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <input
        type={kind}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        onClick={onClick}
        onBlur={onBlur}
        className="sr-only"
      />
      <span
        className={`flex size-5 shrink-0 items-center justify-center border-2 ${shape} ${
          checked ? "border-teal-600 bg-teal-600 text-white" : "border-stone-300 bg-white text-transparent"
        }`}
      >
        <CheckIcon className="size-3" />
      </span>
      <BilingualLabel text={label} size="sm" className="[&>span:first-child]:text-[15px] [&>span:first-child]:font-medium" />
    </label>
  );
}

// 選項文字較長時改為單欄
export function gridClass(options: { label: Bi }[]): string {
  const long = options.some((o) => o.label.zh.length > 8 || o.label.de.length > 20);
  return long ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2";
}
