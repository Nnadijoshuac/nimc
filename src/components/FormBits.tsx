import React from "react";
import { Alert } from "./icons";

/** Inline error banner shared by the public forms. */
export const FormError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900"
    >
      <Alert className="mt-0.5 h-4 w-4 shrink-0 text-[#b4232a]" />
      <p>{message}</p>
    </div>
  ) : null;

/**
 * Off-screen field that humans never see or fill. Bots that auto-complete
 * every input trip it, and the server quietly discards the submission.
 */
export const Honeypot: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <div
    aria-hidden="true"
    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
  >
    <label>
      Company
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  </div>
);

export const Spinner: React.FC = () => (
  <span
    aria-hidden="true"
    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
  />
);
