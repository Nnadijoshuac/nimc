import React, { useState } from "react";
import { X, Calendar, MapPin, CheckCircle, ShieldCheck } from "lucide-react";
import { OFFICE_INFO } from "../data/websiteContent";
import { NimcLogo } from "./logos/NimcLogo";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [service, setService] = useState("New Diaspora NIN Enrolment");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:30 AM");
  const [notes, setNotes] = useState("");
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setIsBooked(false);
    onClose();
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
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!isBooked ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setIsBooked(true);
              }}
              className="space-y-4"
            >
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
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  className="field-control mt-1 px-3 py-2 text-sm"
                >
                  <option value="New Diaspora NIN Enrolment">
                    New diaspora NIN enrolment (adult)
                  </option>
                  <option value="Child / Minor NIN Enrolment">
                    Child / minor NIN enrolment (under 16)
                  </option>
                  <option value="Lost NIN Slip Re-issuance">
                    Lost NIN slip re-issuance and verification
                  </option>
                  <option value="NIN Data Modification & Biometric Update">
                    NIN data modification and biometric update
                  </option>
                </select>
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Full legal name as shown on passport
                <input
                  type="text"
                  required
                  placeholder="e.g. ADEKUNLE BABATUNDE"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field-control mt-1 px-3 py-2 text-sm uppercase"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-stone-700">
                  Phone number
                  <input
                    type="tel"
                    required
                    placeholder="+1 (404) 555-0123"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="field-control mt-1 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-bold text-stone-700">
                  Email address
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="field-control mt-1 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-stone-700">
                  Preferred date
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="field-control mt-1 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-bold text-stone-700">
                  Preferred time
                  <select
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="field-control mt-1 px-3 py-2 text-sm"
                  >
                    {[
                      "09:30 AM",
                      "10:30 AM",
                      "11:30 AM",
                      "01:30 PM",
                      "02:30 PM",
                      "03:30 PM",
                      "04:30 PM",
                    ].map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-bold text-stone-700">
                Additional notes
                <textarea
                  rows={2}
                  placeholder="Family members enrolling together, accessibility needs, or document questions"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="field-control mt-1 px-3 py-2 text-sm"
                />
              </label>

              <div className="flex items-center justify-end gap-3 border-t border-[#eeeeef] pt-4">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 text-xs"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Confirm appointment
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#0a7a4b]">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-950">
                  Appointment confirmed
                </h4>
                <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-stone-600">
                  Thank you, <strong>{name}</strong>. Your appointment is
                  recorded for <strong>{date || "the selected weekday"}</strong>{" "}
                  at <strong>{time}</strong> for{" "}
                  <span className="font-semibold text-[#075f3c]">
                    {service}
                  </span>
                  .
                </p>
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
