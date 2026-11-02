import React from "react";

export type FieldErrors = Partial<Record<string, string>>;

export function validateContact(): FieldErrors {
  return {};
}

export const CONTACT_FIELDS: string[] = [];

interface Props {
  values: Record<string, string>;
  errors: FieldErrors;
  setField: (name: string, value: string) => void;
  onContactBlur: () => void;
  draftSaved: boolean;
}

export const ContactStep: React.FC<Props> = () => (
  <div className="space-y-4 text-sm text-stone-700">
    <p>Contact details are no longer collected through this site.</p>
  </div>
);

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  label: string;
  name: string;
  values: Record<string, string>;
  errors: FieldErrors;
  setField: (name: string, value: string) => void;
  upper?: boolean;
  optional?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({ label }) => (
  <div className="block text-xs font-bold text-stone-700">
    {label}
  </div>
);

export const StepIndicator: React.FC<{ step: number; labels: string[] }> = ({
  labels,
}) => (
  <ol className="mb-5 flex items-center gap-2" aria-label="Form progress">
    {labels.map((label, i) => (
      <li key={label} className="flex flex-1 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eeeeef] text-[11px] font-bold text-stone-500">
          {i + 1}
        </span>
        <span className="text-xs font-semibold text-stone-500">{label}</span>
      </li>
    ))}
  </ol>
);
