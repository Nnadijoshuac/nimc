import React, { useState } from "react";
import {
  FileText,
  CreditCard,
  Building2,
  UserCheck,
  Fingerprint,
  Award,
  Download,
  CheckSquare,
  Square,
  PhoneCall,
  ShieldAlert,
  Clock,
} from "../icons";
import {
  ENROLLMENT_STEPS,
  REQUIRED_DOCUMENTS,
  OFFICE_INFO,
} from "../../data/websiteContent";

export const HowToEnrollView: React.FC = () => {
  const stepIcons = [
    FileText,
    CreditCard,
    Building2,
    UserCheck,
    Fingerprint,
    Award,
  ];

  return (
    <div className="gov-container space-y-12 py-10 sm:py-14">
      <section className="paper-panel overflow-hidden">
        <div className="grid lg:grid-cols-12">
          <div className="space-y-5 p-6 sm:p-10 lg:col-span-7">
            <div className="kicker">Official diaspora registration guide</div>
            <h1 className="font-serif-soft text-4xl font-semibold leading-[1.02] text-stone-950 sm:text-5xl lg:text-6xl">
              How to enroll for your National Identification Number
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
              Follow the six steps in order. Complete your pre-enrolment form,
              bring identification and payment confirmation to the Atlanta
              office, and complete biometric capture with an enrollment officer.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`tel:${OFFICE_INFO.primaryPhone}`}
                className="btn-primary px-5 py-3 text-xs sm:text-sm"
              >
                <PhoneCall className="h-4 w-4" />
                Call the office
              </a>
            </div>
          </div>

          <div className="relative min-h-[300px] border-l border-[#eeeeef] bg-stone-100 lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
              alt="Applicants reviewing official identity registration documentation"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/75 to-transparent p-5 text-xs text-white">
              Authorized identity verification desk - 7046 Covington Highway,
              Suite F, Lithonia
            </div>
          </div>
        </div>
      </section>

      <div className="paper-panel flex flex-col gap-4 bg-[#fbfbfd] p-5 text-stone-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[#eef8f2] p-2 text-[#0a7a4b]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="kicker">Before you visit</span>
            <p className="text-sm font-semibold text-stone-950">
              Complete your form, keep your receipt ready, and bring the same ID
              you used for registration.
            </p>
            <p className="mt-1 text-xs text-stone-700">
              Questions before your visit? Call {OFFICE_INFO.primaryPhone} and
              the office team will guide you.
            </p>
          </div>
        </div>
        <a
          href={`tel:${OFFICE_INFO.primaryPhone}`}
          className="btn-secondary shrink-0 px-4 py-2 text-xs"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Call us
        </a>
      </div>

      <section aria-labelledby="steps-section-title" className="space-y-6">
        <div className="border-b border-[#eeeeef] pb-4">
          <h2
            id="steps-section-title"
            className="font-serif-soft text-3xl font-semibold text-stone-950"
          >
            The six-step registration process
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Each step maps to a real action required before, during, or after
            biometric capture.
          </p>
        </div>

        <div className="space-y-4">
          {ENROLLMENT_STEPS.map((step, idx) => {
            const Icon = stepIcons[idx] || FileText;

            return (
              <article
                key={step.stepNumber}
                id={`enrollment-step-${step.stepNumber}`}
                className="paper-panel p-6"
              >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                  <div className="max-w-3xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef8f2] text-xs font-semibold text-[#075f3c]">
                        {String(step.stepNumber).padStart(2, "0")}
                      </div>
                      <div>
                        <span className="kicker">{step.badge}</span>
                        <h3 className="text-lg font-bold text-stone-950">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-stone-700">
                      {step.fullDesc}
                    </p>

                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-stone-500">
                        Checklist for step {step.stepNumber}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {step.requiredActions.map((action) => (
                          <div
                            key={action}
                            className="flex items-start gap-2 rounded-lg bg-[#f5f5f7] p-2.5 text-xs text-stone-800"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a7a4b]" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {step.tips && (
                      <div className="rounded-lg border border-[#efd088] bg-[#fff9ea] p-3 text-xs text-stone-800">
                        <strong>Office note:</strong> {step.tips}
                      </div>
                    )}
                  </div>

                  <aside className="shrink-0 rounded-lg bg-[#f5f5f7] p-4 lg:w-64">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-stone-900">
                      <Icon className="h-4 w-4 text-[#0a7a4b]" />
                      Step {step.stepNumber} resource
                    </div>

                    {step.stepNumber === 3 && (
                      <a
                        href={`tel:${OFFICE_INFO.primaryPhone}`}
                        className="btn-primary w-full px-3 py-2 text-xs"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Call the office
                      </a>
                    )}

                    {![1, 3].includes(step.stepNumber) && (
                      <p className="text-xs leading-6 text-stone-600">
                        Review this step before your visit so the enrollment
                        officer can process your record without delay.
                      </p>
                    )}

                    <div className="mt-3 border-t border-[#e5e5ea] pt-3 text-[11px] text-stone-500">
                      Center line: {OFFICE_INFO.primaryPhone}
                    </div>
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="checklist-title"
        className="paper-panel p-6 sm:p-8"
      >
        <div className="mb-6 max-w-2xl">
          <div className="kicker">Document preparation</div>
          <h2
            id="checklist-title"
            className="mt-1 font-serif-soft text-3xl font-semibold text-stone-950"
          >
            Required documents checklist
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Check off documents as you prepare for the Atlanta office visit.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {REQUIRED_DOCUMENTS.map((doc) => (
            <div
              key={doc.title}
              className="flex min-h-32 items-start gap-3 border border-[#e5e5ea] bg-[#f5f5f7] p-4 text-left"
            >
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[#0a7a4b]/10" />
              <span>
                <span className="block text-sm font-bold text-stone-950">
                  {doc.title}
                  {doc.required && (
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[#b4232a]">
                      Required
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-6 text-stone-600">
                  {doc.description}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-[#eeeeef] pt-6 text-sm text-stone-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#0a7a4b]" />
            Original documents are scanned and returned during your visit.
          </div>
          <a
            href={`tel:${OFFICE_INFO.primaryPhone}`}
            className="btn-primary px-5 py-2.5 text-xs"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Call us
          </a>
        </div>
      </section>
    </div>
  );
};
