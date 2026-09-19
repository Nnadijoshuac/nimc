import React, { useState, useEffect } from "react";
import { PageId, AccessibilitySettings } from "./types";
import { IslandNavbar } from "./components/IslandNavbar";
import { Footer } from "./components/Footer";
import { HomeView } from "./components/views/HomeView";
import { HowToEnrollView } from "./components/views/HowToEnrollView";
import { FaqView } from "./components/views/FaqView";
import { DataProtectionView } from "./components/views/DataProtectionView";
import { AppointmentModal } from "./components/AppointmentModal";
import { PreEnrollmentModal } from "./components/PreEnrollmentModal";
import { PhoneCall, Calendar, Download } from "lucide-react";
import { OFFICE_INFO } from "./data/websiteContent";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPreEnrollOpen, setIsPreEnrollOpen] = useState(false);

  // Accessibility State
  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>({
      fontScale: "normal",
      highContrast: false,
      reducedMotion: false,
    });

  // Apply accessibility classes to HTML root
  useEffect(() => {
    const root = document.documentElement;

    // Font scaling
    root.classList.remove("font-scale-lg", "font-scale-xl");
    if (accessibilitySettings.fontScale === "large") {
      root.classList.add("font-scale-lg");
    } else if (accessibilitySettings.fontScale === "xlarge") {
      root.classList.add("font-scale-xl");
    }

    // High contrast
    if (accessibilitySettings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [accessibilitySettings]);

  const updateAccessibility = (newSettings: Partial<AccessibilitySettings>) => {
    setAccessibilitySettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Dynamic titles and summaries for the Screen Reader assistant
  const pageMeta: Record<PageId, { title: string; summary: string }> = {
    home: {
      title: "Gateway NIMC Diaspora Enrolment Center Atlanta",
      summary:
        "Official licensed partner for National Identification Number issuance. Visit 1 Glenlake Parkway, Suite 702, Atlanta for on the spot NIN biometrics capture.",
    },
    "how-to-enroll": {
      title: "How to Enroll for your NIN in Diaspora",
      summary:
        "Six-step comprehensive registration guide: pre-enroll, pay online, visit Atlanta office with passport, verify data, capture biometrics, and receive your 11-digit NIN.",
    },
    faq: {
      title: "Frequently Asked Questions & NIMC Regulatory Answers",
      summary:
        "Official answers concerning the NIMC mandate, NIMS system, 11-digit NIN validity, lost slip re-issuance, and diaspora registration eligibility.",
    },
    "data-protection": {
      title: "Data Protection & Biometrics Security Policy",
      summary:
        "Statutory policy detailing end-to-end 256-bit encryption of biometrics, access controls, client privacy rights, and Data Protection Officer contact.",
    },
  };

  return (
    <div className="site-shell min-h-screen flex flex-col text-stone-950 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* Skip to Content for screen reader & keyboard navigation accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#075f3c] focus:text-white focus:rounded-full focus:shadow-lg focus:outline-hidden"
      >
        Skip to main content
      </a>

      {/* Top Modern Header & Navigation */}
      <IslandNavbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        onOpenBooking={() => setIsBookingOpen(true)}
        accessibilitySettings={accessibilitySettings}
        onUpdateAccessibility={updateAccessibility}
        pageTitle={pageMeta[currentPage].title}
        pageSummary={pageMeta[currentPage].summary}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 transition-opacity duration-150"
      >
        {currentPage === "home" && (
          <HomeView
            onNavigate={(page) => setCurrentPage(page)}
            onOpenBooking={() => setIsBookingOpen(true)}
            onOpenPreEnroll={() => setIsPreEnrollOpen(true)}
          />
        )}

        {currentPage === "how-to-enroll" && (
          <HowToEnrollView
            onOpenBooking={() => setIsBookingOpen(true)}
            onOpenPreEnroll={() => setIsPreEnrollOpen(true)}
          />
        )}

        {currentPage === "faq" && (
          <FaqView onOpenBooking={() => setIsBookingOpen(true)} />
        )}

        {currentPage === "data-protection" && <DataProtectionView />}
      </main>

      {/* Sticky Mobile Quick Action Bar (visible on mobile only) */}
      <div
        id="mobile-sticky-quick-bar"
        className="sm:hidden sticky bottom-0 z-40 bg-white/92 backdrop-blur-md border-t border-[#e5e5ea] px-3 py-2 flex items-center justify-between gap-2 shadow-[0_-10px_28px_rgba(29,29,31,0.08)] no-print"
      >
        <button
          onClick={() => setIsPreEnrollOpen(true)}
          className="flex-1 py-2 px-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-stone-900 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-stone-600" />
          Pre-Enroll
        </button>

        <button
          onClick={() => setIsBookingOpen(true)}
          className="btn-primary flex-1 py-2 px-2.5 text-xs"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          Book Visit
        </button>

        <a
          href={`tel:${OFFICE_INFO.primaryPhone}`}
          className="p-2 rounded-full bg-[#b4232a] text-white flex items-center justify-center"
          aria-label="Call Atlanta Office"
        >
          <PhoneCall className="w-4 h-4" />
        </a>
      </div>

      {/* Footer */}
      <Footer onNavigate={(page) => setCurrentPage(page)} />

      {/* Appointment Booking Modal */}
      <AppointmentModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Pre-Enrollment Slip Generator Modal */}
      <PreEnrollmentModal
        isOpen={isPreEnrollOpen}
        onClose={() => setIsPreEnrollOpen(false)}
      />
    </div>
  );
}
