import { useController } from "react-hook-form";
import { isOtherSelected } from "../../survey/conditions";
import { emptyComment, type FieldValue, type FormValues, type Question } from "../../survey/questions";
import { isCommentValue, messageFor, todayISO } from "../../survey/schema";
import BilingualLabel from "./BilingualLabel";
import CheckboxField from "./CheckboxField";
import FieldShell, { NumberBadge } from "./FieldShell";
import MultiChoice from "./MultiChoice";
import OtherInput from "./OtherInput";
import RatingScale from "./RatingScale";
import Reveal from "./Reveal";
import Scale0to10 from "./Scale0to10";
import SignatureField from "./SignatureField";
import SingleChoice from "./SingleChoice";
import Slider0to10 from "./Slider0to10";
import TextAreaWithTranslate from "./TextAreaWithTranslate";
import TextInput from "./TextInput";

type Props = { q: Question; number: string; values: FormValues };

const asString = (v: FieldValue | undefined) => (typeof v === "string" ? v : "");
const asArray = (v: FieldValue | undefined) => (Array.isArray(v) ? v : []);
const asNumber = (v: FieldValue | undefined) => (typeof v === "number" ? v : null);

export default function QuestionField(props: Props) {
  if (props.q.type === "autoDate") {
    return (
      <div className="flex items-start gap-2.5 py-4">
        <NumberBadge number={props.number} />
        <div className="flex-1">
          <BilingualLabel text={props.q.label} />
          <p className="mt-2 text-lg font-medium tabular-nums text-stone-700">{todayISO()}</p>
        </div>
      </div>
    );
  }
  return <ControlledQuestion {...props} />;
}

function ControlledQuestion({ q, number, values }: Props) {
  const { field, fieldState } = useController<FormValues>({ name: q.key });
  const error = messageFor(fieldState.error?.message);
  const inputId = `in-${q.key}`;
  const describedBy = error ? `${q.key}-error` : undefined;
  const invalid = !!error;

  switch (q.type) {
    case "text":
    case "number":
    case "email":
    case "date":
      return (
        <FieldShell q={q} number={number} error={error} inputId={inputId}>
          <TextInput
            q={q}
            inputId={inputId}
            value={asString(field.value)}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            invalid={invalid}
            describedBy={describedBy}
          />
        </FieldShell>
      );
    case "single":
    case "multi":
      return (
        <FieldShell q={q} number={number} error={error}>
          {q.type === "single" ? (
            <SingleChoice q={q} value={asString(field.value)} onChange={field.onChange} onBlur={field.onBlur} />
          ) : (
            <MultiChoice q={q} value={asArray(field.value)} onChange={field.onChange} onBlur={field.onBlur} />
          )}
          <Reveal show={isOtherSelected(q, values)}>
            <OtherInput questionKey={q.key} />
          </Reveal>
        </FieldShell>
      );
    case "rating":
      return (
        <FieldShell q={q} number={number} error={error}>
          <RatingScale q={q} value={asNumber(field.value)} onChange={field.onChange} onBlur={field.onBlur} />
        </FieldShell>
      );
    case "slider":
      return (
        <FieldShell q={q} number={number} error={error} inputId={inputId}>
          <Slider0to10 q={q} inputId={inputId} value={asNumber(field.value)} onChange={field.onChange} onBlur={field.onBlur} />
        </FieldShell>
      );
    case "scale10":
      return (
        <FieldShell q={q} number={number} error={error}>
          <Scale0to10 q={q} value={asNumber(field.value)} onChange={field.onChange} onBlur={field.onBlur} />
        </FieldShell>
      );
    case "comment":
      return (
        <FieldShell q={q} number={number} error={error} inputId={inputId}>
          <TextAreaWithTranslate
            q={q}
            inputId={inputId}
            value={isCommentValue(field.value) ? field.value : emptyComment()}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            invalid={invalid}
            describedBy={describedBy}
          />
        </FieldShell>
      );
    case "checkbox":
      return (
        <CheckboxField
          q={q}
          number={number}
          checked={field.value === true}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={error}
        />
      );
    case "signature":
      return <SignatureField q={q} number={number} value={asString(field.value)} onChange={field.onChange} error={error} />;
  }
}
