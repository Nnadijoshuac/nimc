import React, { useState } from "react";
import {
  X,
  Printer,
  CheckCircle,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "./icons";
import { NimcLogo } from "./logos/NimcLogo";
import { NinSupportLogo } from "./logos/NinSupportLogo";
import { OFFICE_INFO } from "../data/websiteContent";
import { FormError, Honeypot, Spinner } from "./FormBits";
import { SubmissionError, todayInAtlanta } from "../lib/forms";
import {
  CONTACT_FIELDS,
  ContactStep,
  FieldErrors,
  StepIndicator,
  TextField,
  validateContact,
} from "./forms/ContactStep";
import { ResumeData, useFormJourney } from "./forms/useFormJourney";

interface PreEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume?: ResumeData | null;
}

const INITIAL = {
  firstName: "",
  surname: "",
  email: "",
  phone: "",
  whatsapp: "no",
  middleName: "",
  dateOfBirth: "",
  gender: "",
  stateOfOrigin: "",
  passportNumber: "",
};

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

function validateIdentity(values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.dateOfBirth) errors.dateOfBirth = "Enter your date of birth.";
  if (!values.gender) errors.gender = "Select one.";
  if (!values.stateOfOrigin) errors.stateOfOrigin = "Select your state.";
  if (!/^[A-Za-z0-9]{6,20}$/.test(values.passportNumber ?? ""))
    errors.passportNumber =
      "Letters and numbers only, as printed on your passport.";
  return errors;
}

export const PreEnrollmentModal: React.FC<PreEnrollmentModalProps> = ({
  isOpen,
  onClose,
  resume,
}) => {
  const journey = useFormJourney("pre_enrollment", isOpen, INITIAL, resume);
  const { values, setField, step } = journey;
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGenerated = trackingId !== null;

  const updateField = (name: string, value: string) => {
    setErrors((e) => ({ ...e, [name]: undefined }));
    setField(name, value);
  };

  const startNew = () => {
    journey.reset();
    setTrackingId(null);
    setErrors({});
    setError(null);
  };

  const handleClose = () => {
    if (isGenerated) startNew();
    setError(null);
    onClose();
  };

  const continueToIdentity = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      journey.reportError(first, found[first]!);
      return;
    }
    journey.goToStep(2);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const found = validateIdentity(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      journey.reportError(first, found[first]!);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await journey.submit(honeypot);
      setTrackingId(result.reference);
    } catch (err) {
      const message =
        err instanceof SubmissionError
          ? err.message
          : "Something went wrong. Please try again.";
      const field = err instanceof SubmissionError ? err.field : undefined;
      journey.reportError(field ?? "server", message);
      if (field) {
        setErrors({ [field]: message });
        if (CONTACT_FIELDS.includes(field)) journey.goToStep(1);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass = (name: string) =>
    `field-control mt-1 px-3 py-2 text-sm ${errors[name] ? "border-[#b4232a] ring-1 ring-[#b4232a]/30" : ""}`;
  const fieldError = (name: string) =>
    errors[name] ? (
      <span className="mt-1 block text-[11px] font-semibold text-[#b4232a]">
        {errors[name]}
      </span>
    ) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-enrollment-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/65 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="paper-panel my-6 w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eeeeef] bg-[#fbfbfd] px-6 py-4">
          <div className="flex items-center gap-3">
            <NinSupportLogo variant="mark" className="h-11 w-11" />
            <div>
              <h3
                id="pre-enrollment-title"
                className="text-base font-bold text-stone-950"
              >
                NIN pre-enrolment form
              </h3>
              <p className="text-xs text-stone-600">
                Diaspora enrolment service - Atlanta center
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-stone-500 hover:bg-[#f5f5f7] hover:text-stone-950"
            aria-label="Close dialog"
            data-no-track
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {!isGenerated ? (
            <div>
              <StepIndicator
                step={step}
                labels={["Your details", "Identity"]}
              />

              {step === 1 ? (
                <form
                  onSubmit={continueToIdentity}
                  noValidate
                  className="space-y-4"
                >
                  <ContactStep
                    values={values}
                    errors={errors}
                    setField={updateField}
                    onContactBlur={journey.saveNow}
                    draftSaved={journey.draftSaved}
                  />
                  <div className="flex items-center justify-end gap-3 border-t border-[#eeeeef] pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-full px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
                      data-no-track
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-5 py-2.5 text-xs"
                      data-track="Pre-enrolment: continue"
                    >
                      Continue
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="relative space-y-4"
                >
                  <Honeypot value={honeypot} onChange={setHoneypot} />

                  <div className="flex items-start gap-3 rounded-lg bg-emerald-50/80 p-4 text-xs text-stone-700">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7a4b]" />
                    <p className="leading-6">
                      Enter these exactly as they appear on your Nigerian
                      passport. You'll get a printable pre-enrolment slip to
                      bring with your ID and payment receipt to 1 Glenlake
                      Parkway, Suite 702.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <TextField
                      label="Middle name"
                      name="middleName"
                      optional
                      upper
                      placeholder="e.g. EMEKA"
                      autoComplete="additional-name"
                      values={values}
                      errors={errors}
                      setField={updateField}
                    />
                    <TextField
                      label="Date of birth"
                      name="dateOfBirth"
                      type="date"
                      max={todayInAtlanta()}
                      min="1900-01-01"
                      autoComplete="bday"
                      values={values}
                      errors={errors}
                      setField={updateField}
                    />
                    <label className="block text-xs font-bold text-stone-700">
                      Gender
                      <select
                        value={values.gender}
                        onChange={(e) => updateField("gender", e.target.value)}
                        className={selectClass("gender")}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {fieldError("gender")}
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-stone-700">
                      State of origin
                      <select
                        value={values.stateOfOrigin}
                        onChange={(e) =>
                          updateField("stateOfOrigin", e.target.value)
                        }
                        className={selectClass("stateOfOrigin")}
                      >
                        <option value="" disabled>
                          Select your state
                        </option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {fieldError("stateOfOrigin")}
                    </label>
                    <TextField
                      label="Nigerian passport no."
                      name="passportNumber"
                      upper
                      placeholder="e.g. A12345678"
                      autoComplete="off"
                      values={values}
                      errors={errors}
                      setField={updateField}
                    />
                  </div>

                  <FormError message={error} />

                  <div className="flex items-center justify-between gap-3 border-t border-[#eeeeef] pt-4">
                    <button
                      type="button"
                      onClick={() => journey.goToStep(1)}
                      className="rounded-full px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
                      data-no-track
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary px-5 py-2.5 text-xs disabled:cursor-wait disabled:opacity-70"
                      data-track="Pre-enrolment: submit"
                    >
                      {isSubmitting ? (
                        <Spinner />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {isSubmitting
                        ? "Submitting..."
                        : "Submit & generate slip"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              <div
                id="printable-slip"
                className="printable-area space-y-4 border-2 border-stone-950 bg-white p-6 text-stone-950"
              >
                <div className="flex items-center justify-between border-b-2 border-stone-950 pb-4">
                  <div className="flex items-center gap-3">
                    <NimcLogo size="sm" showSubtitle={false} />
                    <div>
                      <div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[#034b2f]">
                        Federal Republic of Nigeria
                      </div>
                      <div className="text-sm font-bold">
                        National Identity Management Commission (NIMC)
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Diaspora enrolment pre-registration slip
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <NinSupportLogo
                      variant="mark"
                      className="ml-auto h-12 w-12"
                    />
                    <div className="mt-1 text-[10px] font-bold text-stone-600">
                      Atlanta center
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#f2eee4] p-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
                      Tracking / pre-enrolment ID
                    </div>
                    <div className="font-mono text-lg font-extrabold tracking-wide">
                      {trackingId}
                    </div>
                  </div>
                  <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-950">
                    Ready for biometrics
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  {[
                    ["Surname", values.surname],
                    [
                      "First and middle",
                      `${values.firstName} ${values.middleName}`.trim(),
                    ],
                    ["Date of birth", values.dateOfBirth],
                    ["Gender", values.gender],
                    ["State of origin", values.stateOfOrigin],
                    ["Passport no.", values.passportNumber],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-stone-300 p-2.5">
                      <span className="block font-mono text-[10px] font-bold uppercase text-stone-500">
                        {label}
                      </span>
                      <strong className="text-sm uppercase text-stone-950">
                        {value}
                      </strong>
                    </div>
                  ))}
                  <div className="border border-stone-300 p-2.5 sm:col-span-2">
                    <span className="block font-mono text-[10px] font-bold uppercase text-stone-500">
                      Contact
                    </span>
                    <strong className="block truncate text-xs text-stone-950">
                      {values.phone} | {values.email}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col items-center border-t border-dashed border-stone-400 pt-3">
                  <div className="flex h-10 items-end gap-1" aria-hidden="true">
                    {[
                      3, 1, 2, 4, 1, 3, 2, 5, 2, 1, 4, 2, 3, 1, 5, 2, 1, 3, 4,
                      2, 1, 3, 5, 1, 2, 3, 2, 4,
                    ].map((height, index) => (
                      <div
                        key={index}
                        className="w-1 bg-stone-950"
                        style={{ height: `${height * 7}px` }}
                      />
                    ))}
                  </div>
                  <span className="mt-1 font-mono text-[10px] tracking-[0.18em] text-stone-600">
                    ATL-702-NIMC-DIASPORA
                  </span>
                </div>

                <div className="border border-stone-300 bg-stone-50 p-3 text-[11px] leading-5 text-stone-700">
                  <strong className="text-stone-950">Next action:</strong> bring
                  this printed slip with valid identification and payment
                  confirmation to {OFFICE_INFO.companyName},{" "}
                  {OFFICE_INFO.address}, {OFFICE_INFO.cityStateZip}.
                  <div className="mt-1 text-[10px] text-stone-500">
                    Phone: {OFFICE_INFO.primaryPhone} | Email:{" "}
                    {OFFICE_INFO.primaryEmail}
                  </div>
                </div>
              </div>

              <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-stone-600">
                    A copy was emailed to <strong>{values.email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={startNew}
                    className="px-3 py-2 text-xs font-bold text-stone-600 hover:bg-[#ede8dc]"
                    data-track="Pre-enrolment: new form"
                  >
                    New form
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-secondary px-4 py-2 text-xs"
                    data-track="Pre-enrolment: print slip"
                  >
                    <Printer className="h-4 w-4" />
                    Print slip
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-primary px-5 py-2 text-xs"
                    data-no-track
                  >
                    <CheckCircle className="h-4 w-4" />
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
