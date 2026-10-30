import type { Bi } from "../../survey/questions";
import { AlertIcon } from "../icons";

export default function ErrorText({ id, message }: { id: string; message?: Bi }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex gap-1.5 text-sm text-red-700">
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <span className="flex flex-col">
        <span lang="zh-Hant">{message.zh}</span>
        <span lang="de" className="text-xs text-red-600">
          {message.de}
        </span>
      </span>
    </p>
  );
}
