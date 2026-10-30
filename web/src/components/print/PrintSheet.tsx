import type { CSSProperties } from "react";
import type { StoredSubmission } from "../../lib/submissions";
import { answeredQuestions, formatTimestamp, shortId, type Answer } from "../../survey/answers";
import { sections, type Bi, type Question } from "../../survey/questions";

type Row = { q: Question; answer: Answer };

function Label({ text }: { text: Bi }) {
  return (
    <>
      {text.zh}
      <span className="ps-sub">{text.de}</span>
    </>
  );
}

function dots(value: number, max: number): string {
  return "●".repeat(value) + "○".repeat(max - value);
}

// 一般答案（格線中的值）。選擇題只列出被選中的選項。
function Value({ answer }: { answer: Answer }) {
  switch (answer.kind) {
    case "text":
    case "date":
      return <>{answer.text}</>;
    case "options":
      return (
        <>
          {answer.options.map((o) => (
            <span key={o.zh + o.de} style={{ display: "block" }}>
              ☑ {o.zh} <span style={{ color: "#444" }}>{o.de}</span>
            </span>
          ))}
          {answer.other && <span style={{ display: "block" }}>（其他 Sonstiges：{answer.other}）</span>}
        </>
      );
    case "scale":
      return (
        <span className="ps-score">
          <strong>{answer.value}</strong> / 10
          <span className="ps-sub">
            0 = {answer.minLabel.zh} {answer.minLabel.de} · 10 = {answer.maxLabel.zh} {answer.maxLabel.de}
          </span>
        </span>
      );
    case "rating":
      return (
        <span className="ps-score">
          {dots(answer.value, 5)} {answer.value}
        </span>
      );
    case "check":
      return <>☑</>;
    case "comment":
    case "signature":
      return null;
  }
}

function SectionBody({ rows }: { rows: Row[] }) {
  const grid = rows.filter((r) => ["text", "options", "scale"].includes(r.answer.kind));
  const ratings = rows.filter((r) => r.answer.kind === "rating");
  const comments = rows.filter((r) => r.answer.kind === "comment");
  const checks = rows.filter((r) => r.answer.kind === "check");
  const signature = rows.find((r) => r.answer.kind === "signature");
  const signedAt = rows.find((r) => r.answer.kind === "date");

  return (
    <>
      {grid.length > 0 && (
        <div className="ps-grid">
          {grid.map(({ q, answer }) => (
            <div key={q.key} className="ps-cell">
              <div>
                <Label text={q.label} />
              </div>
              <div>
                <Value answer={answer} />
              </div>
            </div>
          ))}
        </div>
      )}

      {ratings.length > 0 && (
        <table className="ps-ratings">
          <tbody>
            {ratings.map(({ q, answer }) =>
              answer.kind === "rating" ? (
                <tr key={q.key}>
                  <td>
                    {q.label.zh} <span style={{ fontSize: "7.5pt", color: "#444" }}>{q.label.de}</span>
                  </td>
                  <td className="ps-dots" aria-label={`${answer.value} / 5`}>
                    {dots(answer.value, 5)}
                  </td>
                  <td className="ps-score">
                    {answer.value} / 5 · {answer.label.zh} <span style={{ color: "#444" }}>{answer.label.de}</span>
                  </td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      )}

      {comments.map(({ q, answer }) =>
        answer.kind === "comment" ? (
          <div key={q.key} className="ps-comment">
            <div className="ps-comment-q">
              {q.label.de} <span style={{ fontWeight: 400, color: "#444" }}>/ {q.label.zh}</span>
            </div>
            <div lang="de" className="ps-comment-de">
              {answer.de}
            </div>
            <div lang="zh-Hant" className="ps-comment-zh">
              中文原文 Original (Chinesisch)：{answer.zh}
            </div>
          </div>
        ) : null,
      )}

      {checks.length > 0 && (
        <ul className="ps-checks">
          {checks.map(({ q }) => (
            <li key={q.key}>
              <span className="ps-box">☑</span>
              <span>
                <span lang="de">{q.label.de}</span>
                <span className="ps-sub" lang="zh-Hant">
                  {q.label.zh}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {(signature || signedAt) && (
        <div className="ps-sign">
          {signature?.answer.kind === "signature" && (
            <div>
              <div className="ps-sign-line">
                <img src={signature.answer.src} alt="Unterschrift" />
              </div>
              <div className="ps-sign-label">
                {signature.q.label.zh} {signature.q.label.de}
              </div>
            </div>
          )}
          {signedAt?.answer.kind === "date" && (
            <div>
              <div className="ps-sign-line" style={{ minWidth: "45mm" }}>
                {signedAt.answer.text}
              </div>
              <div className="ps-sign-label">
                簽署日期 Datum der Unterschrift
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function PrintSheet({ sub, printDate }: { sub: StoredSubmission; printDate: string }) {
  // 每筆資料使用自己的具名頁面，頁尾顯示各自的提交編號（批次列印時也正確）
  const pageName = `sheet-${sub.id}`;
  const style: CSSProperties = { page: pageName };
  const footer = `Nr. ${shortId(sub.id)} · 列印 Gedruckt ${printDate}`;

  return (
    <article className="ps" style={style}>
      {/* 內容只含英數編號與日期；不可用 JSX 文字，否則引號會被轉義 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@page ${pageName} { @bottom-left { content: "${footer}"; font: 7.5pt Inter, "Noto Sans TC", "Microsoft JhengHei", sans-serif; color: #333; } }`,
        }}
      />

      <header className="ps-head">
        <h1>
          按摩體驗回饋表
          <span className="ps-de">Massage-Feedback-Bogen</span>
        </h1>
        <dl className="ps-meta">
          <div>
            <dt>提交編號 Nr.</dt>
            <dd>
              <strong>{shortId(sub.id)}</strong>
            </dd>
          </div>
          <div>
            <dt>提交日期 Eingangsdatum</dt>
            <dd>{formatTimestamp(sub.createdAt)}</dd>
          </div>
          <div className="ps-sub">ID {sub.id}</div>
        </dl>
      </header>

      {sections.map((section) => {
        const rows = answeredQuestions(sub, section);
        if (rows.length === 0) return null;
        return (
          <section key={section.id} className="ps-section">
            <h2>
              <span className="ps-letter">{section.id}</span>
              {section.title.zh}
              <span className="ps-de">{section.title.de}</span>
              {section.optional && <span className="ps-de">（自願填寫 freiwillig）</span>}
            </h2>
            <SectionBody rows={rows} />
          </section>
        );
      })}
    </article>
  );
}
