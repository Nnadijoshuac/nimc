import React from "react";
import { Check, ShieldCheck } from "../icons";
import type { FormValues } from "./useFormJourney";
import { isValidEmail, isValidPhone } from "../../lib/forms";

export type FieldErrors = Partial<Record<string, string>>;

/** Step 1 of every form: who you are and how we can reach you. */
export function validateContact(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.firstName?.trim()) errors.firstName = "Enter your first name.";
  if (!values.surname?.trim()) errors.surname = "Enter your surname.";
  if (!isValidEmail(values.email ?? ""))
    errors.email = "Enter a valid email address.";
  if (!isValidPhone(values.phone ?? ""))
    errors.phone = "Enter a phone number we can reach you on.";
  return errors;
}

export const CONTACT_FIELDS = ["firstName", "surname", "email", "phone"];

interface Props {
  values: FormValues;
  errors: FieldErrors;
  setField: (name: string, value: string) => void;
  onContactBlur: () => void;
  draftSaved: boolean;
}

export const ContactStep: React.FC<Props> = ({
  values,
  errors,
  setField,
  onContactBlur,
  draftSaved,
}) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField
        label="First name"
        name="firstName"
        autoComplete="given-name"
        placeholder="e.g. CHUKWUDI"
        values={values}
        errors={errors}
        setField={setField}
        upper
        autoFocus
      />
      <TextField
        label="Surname"
        name="surname"
        autoComplete="family-name"
        placeholder="e.g. OKONKWO"
        values={values}
        errors={errors}
        setField={setField}
        upper
      />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        values={values}
        errors={errors}
        setField={setField}
        onBlur={onContactBlur}
      />
      <TextField
        label="Phone number"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+1 (404) 555-0123"
        values={values}
        errors={errors}
        setField={setField}
        onBlur={onContactBlur}
      />
    </div>

    <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-stone-700">
      <input
        type="checkbox"
        checked={values.whatsapp === "yes"}
        onChange={(e) => setField("whatsapp", e.target.checked ? "yes" : "no")}
        className="h-4 w-4 rounded border-stone-300 accent-[#0a7a4b]"
      />
      This number is on WhatsApp. You can message me there.
    </label>

    <div className="flex items-start gap-2.5 rounded-lg bg-[#f5f5f7] p-3 text-[11px] leading-5 text-stone-600">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0a7a4b]" />
      <p>
        We save your progress as you go, so if you get stuck or are interrupted,
        our Atlanta team can reach out and help you finish. Your details are
        handled under our data protection policy and never sold or shared.
        {draftSaved && (
          <span className="ml-1 inline-flex items-center gap-1 font-semibold text-[#075f3c]">
            <Check className="h-3 w-3" /> Progress saved
          </span>
        )}
      </p>
    </div>
  </div>
);

interface TextFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name"
> {
  label: string;
  name: string;
  values: FormValues;
  errors: FieldErrors;
  setField: (name: string, value: string) => void;
  upper?: boolean;
  optional?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  values,
  errors,
  setField,
  upper,
  optional,
  className = "",
  ...rest
}) => {
  const error = errors[name];
  const id = `field-${name}`;
  return (
    <label htmlFor={id} className="block text-xs font-bold text-stone-700">
      {label}
      {optional && (
        <span className="ml-1 font-normal text-stone-400">(optional)</span>
      )}
      <input
        id={id}
        name={name}
        value={values[name] ?? ""}
        onChange={(e) => setField(name, e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`field-control mt-1 px-3 py-2 text-sm ${upper ? "uppercase placeholder:normal-case" : ""} ${
          error ? "border-[#b4232a] ring-1 ring-[#b4232a]/30" : ""
        } ${className}`}
        {...rest}
      />
      {error && (
        <span
          id={`${id}-error`}
          className="mt-1 block text-[11px] font-semibold text-[#b4232a]"
        >
          {error}
        </span>
      )}
    </label>
  );
};

export const StepIndicator: React.FC<{
  step: number;
  labels: string[];
}> = ({ step, labels }) => (
  <ol className="mb-5 flex items-center gap-2" aria-label="Form progress">
    {labels.map((label, i) => {
      const n = i + 1;
      const done = n < step;
      const active = n === step;
      return (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              done
                ? "bg-[#0a7a4b] text-white"
                : active
                  ? "bg-stone-950 text-white"
                  : "bg-[#eeeeef] text-stone-500"
            }`}
            aria-current={active ? "step" : undefined}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : n}
          </span>
          <span
            className={`text-xs font-semibold ${active ? "text-stone-950" : "text-stone-500"}`}
          >
            {label}
          </span>
          {n < labels.length && (
            <span
              className={`h-px flex-1 ${done ? "bg-[#0a7a4b]" : "bg-[#e5e5ea]"}`}
            />
          )}
        </li>
      );
    })}
  </ol>
);
