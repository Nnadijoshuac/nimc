import React, { useState } from "react";
import {
  X,
  Calendar,
  MapPin,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
} from "./icons";
import { OFFICE_INFO } from "../data/websiteContent";
import { NimcLogo } from "./logos/NimcLogo";
import { FormError, Honeypot, Spinner } from "./FormBits";
import { SubmissionError, todayInAtlanta } from "../lib/forms";
import {
  CONTACT_FIELDS,
  ContactStep,
  FieldErrors,
  StepIndicator,
  validateContact,
} from "./forms/ContactStep";
import { ResumeData, useFormJourney } from "./forms/useFormJourney";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume?: ResumeData | null;
}

const SERVICES: [value: string, label: string][] = [
  ["New Diaspora NIN Enrolment", "New diaspora NIN enrolment (adult)"],
  ["Child / Minor NIN Enrolment", "Child / minor NIN enrolment (under 16)"],
  ["Lost NIN Slip Re-issuance", "Lost NIN slip re-issuance and verification"],
  [
    "NIN Data Modification & Biometric Update",
    "NIN data modification and biometric update",
  ],
];

const TIME_SLOTS = [
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
];

const INITIAL = {
  firstName: "",
  surname: "",
  email: "",
  phone: "",
  whatsapp: "no",
  service: SERVICES[0][0],
  date: "",
  time: "10:30 AM",
  notes: "",
};

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  resume,
}) => {
  const journey = useFormJourney("appointment", isOpen, INITIAL, resume);
  const { values, setField, step } = journey;
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBooked = reference !== null;

  const resetAndClose = () => {
    if (isBooked) {
      journey.reset();
      setReference(null);
    }
    setErrors({});
    setError(null);
    onClose();
  };

  const continueToVisit = (event: React.FormEvent) => {
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
    if (!values.date) {
      setErrors({ date: "Choose a date." });
      journey.reportError("date", "missing");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await journey.submit(honeypot);
      setReference(result.reference);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/65 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="paper-panel my-6 w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eeeeef] bg-[#fbfbfd] px-6 py-4">
          <div className="flex items-center gap-3">
            <NimcLogo size="sm" showSubtitle={false} />
            <div>
              <h3
                id="booking-title"
                className="text-base font-bold text-stone-950"
              >
                Schedule Atlanta biometric appointment
              </h3>
              <p className="text-xs text-stone-600">
                1 Glenlake Parkway, Suite 702 - Atlanta, GA 30328
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-full p-2 text-stone-500 hover:bg-[#f5f5f7] hover:text-stone-950"
            aria-label="Close booking modal"
            data-no-track
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!isBooked ? (
            <>
              <StepIndicator step={step} labels={["Your details", "Visit"]} />

              {step === 1 ? (
                <form
                  onSubmit={continueToVisit}
                  noValidate
                  className="relative space-y-4"
                >
                  <ContactStep
                    values={values}
                    errors={errors}
                    setField={(name, value) => {
                      setErrors((e) => ({ ...e, [name]: undefined }));
                      setField(name, value);
                    }}
                    onContactBlur={journey.saveNow}
                    draftSaved={journey.draftSaved}
                  />
                  <div className="flex items-center justify-end gap-3 border-t border-[#eeeeef] pt-4">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
                      data-no-track
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-5 py-2.5 text-xs"
                      data-track="Appointment: continue"
                    >
                      Continue
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="relative space-y-4">
                  <Honeypot value={honeypot} onChange={setHoneypot} />

                  <div className="flex items-start gap-2.5 rounded-lg bg-[#f5f5f7] p-3.5 text-xs text-stone-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0a7a4b]" />
                    <p>
                      Appointments help reduce waiting time. Walk-ins may be
                      accommodated Monday-Friday, 9am-5pm.
                    </p>
                  </div>

                  <label className="block text-xs font-bold text-stone-700">
                    Service required
                    <select
                      value={values.service}
                      onChange={(e) => setField("service", e.target.value)}
                      className="field-control mt-1 px-3 py-2 text-sm"
                    >
                      {SERVICES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-stone-700">
                      Preferred date
                      <input
                        type="date"
                        required
                        min={todayInAtlanta()}
                        value={values.date}
                        onChange={(e) => {
                          setErrors((x) => ({ ...x, date: undefined }));
                          setField("date", e.target.value);
                        }}
                        aria-invalid={Boolean(errors.date)}
                        className={`field-control mt-1 px-3 py-2 text-sm ${errors.date ? "border-[#b4232a]" : ""}`}
                      />
                      {errors.date && (
                        <span className="mt-1 block text-[11px] font-semibold text-[#b4232a]">
                          {errors.date}
                        </span>
                      )}
                    </label>
                    <label className="block text-xs font-bold text-stone-700">
                      Preferred time
                      <select
                        value={values.time}
                        onChange={(e) => setField("time", e.target.value)}
                        className="field-control mt-1 px-3 py-2 text-sm"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-stone-700">
                    Additional notes
                    <span className="ml-1 font-normal text-stone-400">
                      (optional)
                    </span>
                    <textarea
                      rows={2}
                      placeholder="Family members enrolling together, accessibility needs, or document questions"
                      value={values.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      className="field-control mt-1 px-3 py-2 text-sm"
                    />
                  </label>

                  <FormError message={error} />

                  <div className="flex items-center justify-between gap-3 border-t border-[#eeeeef] pt-4">
                    <button
                      type="button"
                      onClick={() => journey.goToStep(1)}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
                      data-no-track
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary px-5 py-2.5 text-xs disabled:cursor-wait disabled:opacity-70"
                      data-track="Appointment: submit"
                    >
                      {isSubmitting ? (
                        <Spinner />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                      {isSubmitting ? "Sending..." : "Request appointment"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#0a7a4b]">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-950">
                  Appointment request received
                </h4>
                <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-stone-600">
                  Thank you, <strong>{values.firstName}</strong>. We have your
                  request for <strong>{values.date}</strong> at{" "}
                  <strong>{values.time}</strong> for{" "}
                  <span className="font-semibold text-[#075f3c]">
                    {values.service}
                  </span>
                  . A confirmation has been sent to{" "}
                  <strong>{values.email}</strong>, and our team will contact you
                  to confirm the slot.
                </p>
              </div>

              <div className="mx-auto max-w-md rounded-lg bg-[#f2eee4] p-3 text-left">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
                  Your reference
                </div>
                <div className="font-mono text-lg font-extrabold tracking-wide text-stone-950">
                  {reference}
                </div>
              </div>

              <div className="mx-auto max-w-md space-y-2 rounded-lg bg-[#f5f5f7] p-4 text-left text-xs">
                <div className="flex items-center gap-2 font-semibold text-stone-950">
                  <MapPin className="h-4 w-4 text-stone-600" />
                  {OFFICE_INFO.companyName}
                </div>
                <p className="pl-6 text-stone-700">
                  {OFFICE_INFO.address}, {OFFICE_INFO.cityStateZip}
                </p>
                <a
                  href={`tel:${OFFICE_INFO.primaryPhone}`}
                  className="block pl-6 font-semibold text-[#075f3c] hover:underline"
                >
                  {OFFICE_INFO.primaryPhone}
                </a>
              </div>

              <button
                onClick={resetAndClose}
                className="btn-primary px-6 py-2.5 text-xs"
                data-no-track
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
