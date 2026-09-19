import React from "react";
import {
  ShieldCheck,
  Lock,
  Printer,
  UserCheck,
  Mail,
  Phone,
} from "../icons";
import {
  DATA_PROTECTION_SECTIONS,
  OFFICE_INFO,
} from "../../data/websiteContent";

export const DataProtectionView: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="gov-container max-w-5xl space-y-10 py-10 sm:py-14">
      <section className="paper-panel p-6 text-center sm:p-8">
        <div className="kicker inline-flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Statutory compliance and privacy
        </div>
        <h1 className="mt-2 font-serif-soft text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
          Data protection policy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
          Gateway protects demographic records and biometric data collected for
          NIMC diaspora enrolment services.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-600">
          <span>
            Effective date: <strong>{OFFICE_INFO.dpo.effectiveDate}</strong>
          </span>
          <span className="text-stone-400">|</span>
          <span>
            Version: <strong>2.4 diaspora</strong>
          </span>
          <span className="text-stone-400">|</span>
          <button
            onClick={handlePrint}
            className="no-print inline-flex items-center gap-1 font-semibold text-[#075f3c] hover:underline"
          >
            <Printer className="h-3.5 w-3.5" />
            Print policy
          </button>
        </div>
      </section>

      <div className="paper-panel bg-[#eef8f2] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-white p-2.5 text-[#0a7a4b]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-950">
                Encrypted biometric processing
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-7 text-stone-600">
                Facial portraits and 10-finger biometric scans are handled
                through controlled systems and transmitted to the appropriate
                NIMC identity infrastructure.
              </p>
            </div>
          </div>

          <div className="border-t border-emerald-100 pt-4 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="text-lg font-semibold text-[#075f3c]">
              256-bit SSL
            </div>
            <div className="text-stone-600">Restricted access controls</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {DATA_PROTECTION_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`policy-section-${section.id}`}
            className="paper-panel p-6 sm:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef8f2] text-xs font-semibold text-[#075f3c]">
                {section.number}
              </span>
              <h2 className="font-serif-soft text-2xl font-semibold text-stone-950">
                {section.title}
              </h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-stone-700">
              {section.content}
            </p>

            {section.subsections && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {section.subsections.map((sub) => (
                  <div key={sub.number} className="rounded-lg bg-[#f5f5f7] p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#075f3c]">
                        {sub.number}
                      </span>
                      <h3 className="text-xs font-bold text-stone-950">
                        {sub.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-stone-600">
                      {sub.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="paper-panel bg-[#fbfbfd] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-[#0a7a4b]" />
          <h3 className="font-serif-soft text-2xl font-semibold text-stone-950">
            Data Protection Officer contact
          </h3>
        </div>

        <p className="mt-3 text-sm leading-7 text-stone-700">
          For questions about data handling, biometric privacy, or statutory
          data rights, contact the appointed Data Protection Officer.
        </p>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4">
            <span className="text-[11px] font-semibold text-stone-500">
              Officer
            </span>
            <div className="mt-1 font-semibold text-stone-950">
              {OFFICE_INFO.dpo.name}
            </div>
            <div className="text-xs text-stone-600">
              Compliance and privacy lead
            </div>
          </div>

          <div className="rounded-lg bg-white p-4">
            <span className="text-[11px] font-semibold text-stone-500">
              Email
            </span>
            <a
              href={`mailto:${OFFICE_INFO.dpo.email}`}
              className="mt-1 flex items-center gap-1.5 font-semibold text-[#075f3c] hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              {OFFICE_INFO.dpo.email}
            </a>
          </div>

          <div className="rounded-lg bg-white p-4">
            <span className="text-[11px] font-semibold text-stone-500">
              Telephone
            </span>
            <a
              href={`tel:${OFFICE_INFO.dpo.phone}`}
              className="mt-1 flex items-center gap-1.5 font-semibold text-stone-950 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {OFFICE_INFO.dpo.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
