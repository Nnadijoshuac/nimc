import React from "react";
import { NimcLogo } from "./logos/NimcLogo";
import { GatewayLogo } from "./logos/GatewayLogo";
import { OFFICE_INFO } from "../data/websiteContent";
import { PageId } from "../types";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  ArrowUp,
  ExternalLink,
} from "lucide-react";

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navigate = (page: PageId) => {
    onNavigate(page);
    scrollToTop();
  };

  return (
    <footer
      id="website-footer"
      className="mt-12 border-t border-[#e5e5ea] bg-[#f5f5f7] text-stone-700"
    >
      <div className="gov-container py-10 sm:py-12">
        <div className="paper-panel mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#eef8f2] p-2.5 text-[#0a7a4b]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-stone-950">
                Authorized diaspora identity service center
              </div>
              <div className="text-sm text-stone-500">
                NIN enrolment support, biometric capture, slip retrieval, and
                data protection contact.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("how-to-enroll")}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Enrolment guide
            </button>
            <button
              onClick={() => navigate("data-protection")}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Data protection
            </button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <GatewayLogo variant="full" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-stone-600">
              Atlanta office support for Nigerian National Identification Number
              services, including biometric enrolment and NIN slip assistance.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <NimcLogo size="sm" showSubtitle={false} className="opacity-80" />
              <div className="text-xs text-stone-500">
                Service references the NIMC diaspora enrolment process.
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-950">Site</h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              {[
                ["Home", "home"],
                ["How to enroll", "how-to-enroll"],
                ["Questions", "faq"],
                ["Data protection", "data-protection"],
              ].map(([label, page]) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page as PageId)}
                    className="hover:text-stone-950 hover:underline"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="https://www.nimc.gov.ng"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-stone-950 hover:underline"
                >
                  NIMC headquarters
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-950">
              Atlanta office
            </h3>
            <div className="mt-4 space-y-4 text-sm text-stone-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#0a7a4b]" />
                <div>
                  <div className="font-semibold text-stone-950">
                    {OFFICE_INFO.address}
                  </div>
                  <div>{OFFICE_INFO.cityStateZip}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-[#0a7a4b]" />
                <a
                  href={`mailto:${OFFICE_INFO.primaryEmail}`}
                  className="hover:text-stone-950 hover:underline"
                >
                  {OFFICE_INFO.primaryEmail}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-1 h-4 w-4 shrink-0 text-[#0a7a4b]" />
                <div>
                  <a
                    href={`tel:${OFFICE_INFO.primaryPhone}`}
                    className="block font-semibold text-stone-950 hover:underline"
                  >
                    {OFFICE_INFO.primaryPhone}
                  </a>
                  <a
                    href={`tel:${OFFICE_INFO.secondaryPhone}`}
                    className="block hover:text-stone-950 hover:underline"
                  >
                    {OFFICE_INFO.secondaryPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-950">Hours</h3>
            <div className="mt-4 space-y-3 text-sm text-stone-600">
              <div className="flex gap-2">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-[#0a7a4b]" />
                <div>
                  <div className="font-semibold text-stone-950">
                    Monday-Friday
                  </div>
                  <div>9:00 AM-5:00 PM EST</div>
                </div>
              </div>
              <div className="rounded-lg bg-white p-3 text-xs leading-6 text-stone-600">
                <div className="font-semibold text-stone-950">
                  Data Protection Officer
                </div>
                <div>{OFFICE_INFO.dpo.name}</div>
                <div>Effective: {OFFICE_INFO.dpo.effectiveDate}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#e5e5ea] pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright {new Date().getFullYear()} Gateway. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("data-protection")}
              className="hover:text-stone-800 hover:underline"
            >
              Privacy and data policy
            </button>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 hover:text-stone-800 hover:underline"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
