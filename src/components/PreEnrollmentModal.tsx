import React from "react";
import { X, PhoneCall } from "./icons";
import { NinSupportLogo } from "./logos/NinSupportLogo";
import { OFFICE_INFO } from "../data/websiteContent";

interface PreEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume?: unknown | null;
}

export const PreEnrollmentModal: React.FC<PreEnrollmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-enrollment-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/65 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="paper-panel my-6 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eeeeef] bg-[#fbfbfd] px-6 py-4">
          <div className="flex items-center gap-3">
            <NinSupportLogo variant="mark" className="h-11 w-11" />
            <div>
              <h3 id="pre-enrollment-title" className="text-base font-bold text-stone-950">
                Pre-enrolment not available
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-[#f5f5f7] hover:text-stone-950"
            aria-label="Close dialog"
            data-no-track
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6 text-sm leading-7 text-stone-700">
          <p>
            We have removed online form filling from this site. Please contact the
            office directly for enrolment guidance.
          </p>
          <a href={`tel:${OFFICE_INFO.primaryPhone}`} className="btn-primary w-full px-5 py-3 text-xs">
            <PhoneCall className="h-4 w-4" />
            Call {OFFICE_INFO.primaryPhone}
          </a>
        </div>
      </div>
    </div>
  );
};
