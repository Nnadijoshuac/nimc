import React, { useState } from "react";
import { X, Printer, CheckCircle, ShieldCheck, FileText } from "lucide-react";
import { NimcLogo } from "./logos/NimcLogo";
import { GatewayLogo } from "./logos/GatewayLogo";
import { OFFICE_INFO } from "../data/websiteContent";

interface PreEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreEnrollmentModal: React.FC<PreEnrollmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [surname, setSurname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [stateOfOrigin, setStateOfOrigin] = useState("Lagos");
  const [passportNumber, setPassportNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  if (!isOpen) return null;

  const trackingId = `NIMC-ATL-${(surname + firstName || "APP").slice(0, 3).toUpperCase()}-94821`;

  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    type = "text",
    required = true,
    extraClass = "",
  ) => (
    <label className="block text-xs font-bold text-stone-700">
      {label}
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`field-control mt-1 px-3 py-2 text-sm ${extraClass}`}
      />
    </label>
  );

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
            <NimcLogo size="sm" showSubtitle={false} />
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
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-[#f5f5f7] hover:text-stone-950"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {!isGenerated ? (
            <div>
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-emerald-50/80 p-4 text-xs text-stone-700">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7a4b]" />
                <div>
                  <p className="text-sm font-bold text-emerald-950">
                    Step 1: complete pre-registration
                  </p>
                  <p className="mt-1 leading-6">
                    Generate a printable pre-enrolment slip and bring it with
                    identification and payment receipt to 1 Glenlake Parkway,
                    Suite 702.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setIsGenerated(true);
                }}
                className="space-y-4"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {field(
                    "Surname",
                    surname,
                    setSurname,
                    "e.g. OKONKWO",
                    "text",
                    true,
                    "uppercase",
                  )}
                  {field(
                    "First name",
                    firstName,
                    setFirstName,
                    "e.g. CHUKWUDI",
                    "text",
                    true,
                    "uppercase",
                  )}
                  {field(
                    "Middle name",
                    middleName,
                    setMiddleName,
                    "e.g. EMEKA",
                    "text",
                    false,
                    "uppercase",
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {field("Date of birth", dob, setDob, "", "date")}
                  <label className="block text-xs font-bold text-stone-700">
                    Gender
                    <select
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                      className="field-control mt-1 px-3 py-2 text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  {field(
                    "State of origin",
                    stateOfOrigin,
                    setStateOfOrigin,
                    "e.g. Edo / Delta / Lagos / Imo",
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {field(
                    "Nigerian passport no.",
                    passportNumber,
                    setPassportNumber,
                    "e.g. A12345678",
                    "text",
                    true,
                    "uppercase",
                  )}
                  {field(
                    "US contact phone",
                    phoneNumber,
                    setPhoneNumber,
                    "e.g. +1 (404) 555-0199",
                    "tel",
                  )}
                  {field(
                    "Email address",
                    email,
                    setEmail,
                    "e.g. applicant@gmail.com",
                    "email",
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#eeeeef] pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2.5 text-xs"
                  >
                    <FileText className="h-4 w-4" />
                    Generate slip
                  </button>
                </div>
              </form>
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
                    <GatewayLogo variant="icon-only" />
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
                    ["Surname", surname || "APPLICANT"],
                    [
                      "First and middle",
                      `${firstName} ${middleName}`.trim() || "APPLICANT",
                    ],
                    ["Date of birth", dob || "Not provided"],
                    ["Gender", gender],
                    ["State of origin", stateOfOrigin],
                    ["Passport no.", passportNumber || "Not provided"],
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
                      {phoneNumber} | {email}
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
                <button
                  type="button"
                  onClick={() => setIsGenerated(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-[#ede8dc]"
                >
                  Edit information
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    <Printer className="h-4 w-4" />
                    Print slip
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-primary px-5 py-2 text-xs"
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
