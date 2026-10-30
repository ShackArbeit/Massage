import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import BilingualLabel from "../components/form/BilingualLabel";
import ProgressBar, { type ProgressItem } from "../components/form/ProgressBar";
import QuestionField from "../components/form/QuestionField";
import Reveal from "../components/form/Reveal";
import SectionCard from "../components/form/SectionCard";
import SubmitBar, { type MissingItem } from "../components/form/SubmitBar";
import PrivacyNote from "../components/PrivacyNote";
import { clearDraft, loadDraft, saveDraft } from "../lib/draft";
import { submitErrorMessage, submitSurvey } from "../lib/submit";
import { isEmptyValue, isVisible, staleFields } from "../survey/conditions";
import {
  buildDefaultValues,
  defaultValueFor,
  hasOtherOption,
  otherKeyOf,
  sections,
  type Bi,
  type FormValues,
  type Section,
  type SectionId,
} from "../survey/questions";
import { isAnswered, surveySchema } from "../survey/schema";

const OPTIONAL_SECTION = sections.find((s) => s.optional);

function sectionHasData(section: Section | undefined, values: FormValues): boolean {
  return !!section?.questions.some((q) => !isEmptyValue(values[q.key]));
}

// 依顯示順序編號（A1、A2…），隱藏題不佔號
function numberQuestions(values: FormValues): Map<string, string> {
  const numbers = new Map<string, string>();
  for (const s of sections) {
    let n = 0;
    for (const q of s.questions) {
      if (isVisible(q.key, values)) numbers.set(q.key, `${s.id}${++n}`);
    }
  }
  return numbers;
}

// 所有欄位（含「其他」文字欄）的顯示順序，用於捲動到第一個錯誤與缺漏清單
const FIELD_ORDER: { key: string; questionKey: string; sectionId: SectionId; label: Bi }[] = sections.flatMap((s) =>
  s.questions.flatMap((q) => {
    const own = { key: q.key, questionKey: q.key, sectionId: s.id, label: q.label };
    if (!hasOtherOption(q)) return [own];
    const other = {
      key: otherKeyOf(q.key),
      questionKey: q.key,
      sectionId: s.id,
      label: { zh: `${q.label.zh} – 其他說明`, de: `${q.label.de} – Sonstiges` },
    };
    return [own, other];
  }),
);

export default function SurveyPage() {
  const navigate = useNavigate();
  const initialValues = useMemo(() => loadDraft(buildDefaultValues()), []);
  const methods = useForm<FormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(surveySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const { watch, setValue, handleSubmit, formState } = methods;
  const values = watch();
  const isSubmitted = formState.isSubmitted;

  const [optionalOpen, setOptionalOpen] = useState(() => sectionHasData(OPTIONAL_SECTION, initialValues));
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: Bi }>();
  const optionalHasData = sectionHasData(OPTIONAL_SECTION, values);

  // 被隱藏的題目與未選「其他」的文字欄：清除殘留值
  useEffect(() => {
    for (const f of staleFields(values)) setValue(f.name, f.value, { shouldValidate: isSubmitted });
  }, [values, setValue, isSubmitted]);

  // 草稿保護（送出成功後不再寫回）
  const submittedRef = useRef(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!submittedRef.current) saveDraft(values);
    }, 400);
    return () => window.clearTimeout(t);
  }, [values]);

  const numbers = numberQuestions(values);

  const progress: ProgressItem[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
    optional: !!s.optional,
    done: s.questions.filter((q) => q.required && isVisible(q.key, values)).every((q) => isAnswered(q, values)),
  }));

  const missing: MissingItem[] =
    formState.submitCount > 0
      ? FIELD_ORDER.filter((f) => formState.errors[f.key]).map((f) => ({
          key: f.key,
          number: numbers.get(f.questionKey) ?? "",
          label: f.label,
        }))
      : [];

  function jumpTo(key: string) {
    const field = FIELD_ORDER.find((f) => f.key === key);
    const needsOpen = field?.sectionId === OPTIONAL_SECTION?.id && !optionalOpen;
    if (needsOpen) setOptionalOpen(true);
    window.setTimeout(
      () => {
        const el = document.getElementById(`q-${key}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.querySelector<HTMLElement>("input, textarea, button")?.focus({ preventScroll: true });
      },
      needsOpen ? 350 : 0,
    );
  }

  function jumpToSection(id: SectionId) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function skipOptionalSection() {
    if (!OPTIONAL_SECTION) return;
    for (const q of OPTIONAL_SECTION.questions) {
      const def = defaultValueFor(q);
      if (def !== undefined) setValue(q.key, def, { shouldValidate: isSubmitted });
      if (hasOtherOption(q)) setValue(otherKeyOf(q.key), "", { shouldValidate: isSubmitted });
    }
    setOptionalOpen(false);
  }

  async function onValid(data: FormValues) {
    setStatus(undefined);
    try {
      await submitSurvey(data);
      submittedRef.current = true;
      clearDraft();
      navigate("/thanks", { replace: true });
    } catch (e) {
      setStatus({ kind: "error", message: submitErrorMessage(e) });
    }
  }

  function onInvalid(errors: FieldErrors<FormValues>) {
    setStatus(undefined);
    const first = FIELD_ORDER.find((f) => errors[f.key]);
    if (first) jumpTo(first.key);
  }

  return (
    <FormProvider {...methods}>
      <ProgressBar items={progress} onJump={jumpToSection} />
      <div className="mx-auto max-w-[720px] px-4 pt-6 pb-48">
        <header className="mb-6 px-1">
          <h1>
            <BilingualLabel
              text={{ zh: "按摩體驗回饋", de: "Massage-Feedback" }}
              size="lg"
              className="[&>span:first-child]:text-2xl [&>span:last-child]:text-base"
            />
          </h1>
          <div className="mt-3 space-y-1 text-sm text-stone-600">
            <p>
              感謝您體驗我的按摩！這份問卷約需 5 分鐘，您的回饋將作為我申請德國／奧地利職業培訓（Ausbildung）的佐證資料。
            </p>
            <p lang="de" className="text-stone-500">
              Vielen Dank, dass Sie eine Massage bei mir ausprobiert haben! Der Fragebogen dauert etwa 5 Minuten. Ihr
              Feedback dient als Nachweis für meine Bewerbung um eine Ausbildung in Deutschland bzw. Österreich.
            </p>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            <span className="text-red-600">*</span> 必填 <span lang="de">· Pflichtfeld</span>
          </p>
        </header>

        <form noValidate onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-5">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              optional={
                section.optional
                  ? {
                      open: optionalOpen,
                      hasData: optionalHasData,
                      onToggle: () => setOptionalOpen((o) => !o),
                      onSkip: skipOptionalSection,
                    }
                  : undefined
              }
            >
              {section.questions.map((q) => {
                const number = numbers.get(q.key);
                return (
                  <Reveal key={q.key} show={number !== undefined}>
                    <QuestionField q={q} number={number ?? ""} values={values} />
                  </Reveal>
                );
              })}
            </SectionCard>
          ))}
          <SubmitBar missing={missing} onJump={jumpTo} submitting={formState.isSubmitting} status={status} />
        </form>
      </div>
      <PrivacyNote />
    </FormProvider>
  );
}
