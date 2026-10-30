import { answerOf, formatTimestamp, shortId, type Answer } from "../survey/answers";
import { allQuestions, type Question } from "../survey/questions";
import type { StoredSubmission } from "./submissions";

type Column = { header: string; value: (s: StoredSubmission) => string };

function answerText(a: Answer | null): string {
  if (!a) return "";
  switch (a.kind) {
    case "text":
    case "date":
      return a.text;
    case "options": {
      const labels = a.options.map((o) => `${o.zh} ${o.de}`);
      return [...labels, ...(a.other ? [a.other] : [])].join("; ");
    }
    case "rating":
    case "scale":
      return String(a.value);
    case "check":
      return "是 ja";
    case "comment":
    case "signature":
      return "";
  }
}

function questionColumns(q: Question): Column[] {
  const header = `${q.label.zh} ${q.label.de}`;
  switch (q.type) {
    case "signature":
    case "autoDate":
      return []; // 簽名圖不匯出；簽署日期即提交時間
    case "comment": {
      const comment = (s: StoredSubmission) => {
        const a = answerOf(s, q);
        return a?.kind === "comment" ? a : undefined;
      };
      return [
        { header: `${header}（德文 Deutsch）`, value: (s) => comment(s)?.de ?? "" },
        { header: `${header}（中文 Chinesisch）`, value: (s) => comment(s)?.zh ?? "" },
      ];
    }
    default:
      return [{ header, value: (s) => answerText(answerOf(s, q)) }];
  }
}

const COLUMNS: Column[] = [
  { header: "提交編號 Nr.", value: (s) => shortId(s.id) },
  { header: "文件 ID Dokument-ID", value: (s) => s.id },
  { header: "提交時間 Eingang", value: (s) => formatTimestamp(s.createdAt) },
  ...allQuestions.flatMap(questionColumns),
];

function escapeCell(raw: string): string {
  // 防 CSV 注入：受試者內容不得被試算表當成公式執行
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCsv(items: StoredSubmission[]): string {
  const rows = [COLUMNS.map((c) => c.header), ...items.map((s) => COLUMNS.map((c) => c.value(s)))];
  // 開頭 BOM 讓 Excel 以 UTF-8 開啟，中文與德文才不會亂碼
  return `﻿${rows.map((r) => r.map(escapeCell).join(",")).join("\r\n")}\r\n`;
}

export function downloadCsv(items: StoredSubmission[], fileName: string): void {
  const url = URL.createObjectURL(new Blob([buildCsv(items)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
