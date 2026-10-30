import type { ReactNode } from "react";
import type { Section } from "../../survey/questions";
import { ChevronIcon } from "../icons";
import BilingualLabel from "./BilingualLabel";
import ButtonLabel from "./ButtonLabel";
import Reveal from "./Reveal";

type OptionalControls = {
  open: boolean;
  hasData: boolean;
  onToggle: () => void;
  onSkip: () => void;
};

type Props = { section: Section; children: ReactNode; optional?: OptionalControls };

export default function SectionCard({ section, children, optional }: Props) {
  const body = <div className="divide-y divide-stone-100">{children}</div>;
  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={`section-${section.id}-title`}
      className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-7"
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-lg font-semibold text-white"
        >
          {section.id}
        </span>
        <h2 id={`section-${section.id}-title`} className="flex-1">
          <BilingualLabel text={section.title} size="lg" />
        </h2>
        {section.optional && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-center text-xs font-medium leading-tight text-amber-800 ring-1 ring-amber-200">
            選填
            <br />
            Freiwillig
          </span>
        )}
      </header>

      {section.description && (
        <div className={`mt-4 rounded-xl px-4 py-3 ${section.optional ? "bg-amber-50/60" : "bg-stone-50"}`}>
          <BilingualLabel text={section.description} size="sm" className="[&>span:first-child]:text-stone-700" />
        </div>
      )}

      {optional ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={optional.onToggle}
              aria-expanded={optional.open}
              aria-controls={`section-${section.id}-body`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-600 bg-white px-4 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              <ButtonLabel text={optional.open ? { zh: "收合本區", de: "Einklappen" } : { zh: "展開填寫", de: "Ausfüllen" }} />
              <ChevronIcon className={`size-4 transition-transform ${optional.open ? "rotate-180" : ""}`} />
            </button>
            {(optional.open || optional.hasData) && (
              <button
                type="button"
                onClick={optional.onSkip}
                className="inline-flex min-h-11 items-center rounded-xl px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
              >
                <ButtonLabel
                  text={optional.hasData ? { zh: "清除並略過本區", de: "Leeren & überspringen" } : { zh: "略過本區", de: "Überspringen" }}
                />
              </button>
            )}
            {!optional.open && (
              <span className="text-xs text-stone-500">
                {optional.hasData ? "已填寫部分內容 · teilweise ausgefüllt" : "已略過 · übersprungen"}
              </span>
            )}
          </div>
          <div id={`section-${section.id}-body`}>
            <Reveal show={optional.open}>
              <div className="mt-2">{body}</div>
            </Reveal>
          </div>
        </>
      ) : (
        <div className="mt-2">{body}</div>
      )}
    </section>
  );
}
