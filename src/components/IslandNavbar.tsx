import React, { useState } from "react";
import { NimcLogo } from "./logos/NimcLogo";
import { AccessibilityToolbar } from "./AccessibilityToolbar";
import { PageId, AccessibilitySettings } from "../types";
import {
  Menu,
  X,
  PhoneCall,
  CalendarCheck,
  FileText,
  ShieldCheck,
  HelpCircle,
  Home,
  ChevronRight,
} from "lucide-react";
import { OFFICE_INFO } from "../data/websiteContent";

interface IslandNavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenBooking: () => void;
  accessibilitySettings: AccessibilitySettings;
  onUpdateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  pageTitle: string;
  pageSummary: string;
}

export const IslandNavbar: React.FC<IslandNavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenBooking,
  accessibilitySettings,
  onUpdateAccessibility,
  pageTitle,
  pageSummary,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: {
    id: PageId;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "how-to-enroll", label: "Enroll", icon: FileText },
    { id: "faq", label: "Questions", icon: HelpCircle },
    { id: "data-protection", label: "Privacy", icon: ShieldCheck },
  ];

  const handleLinkClick = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/72 backdrop-blur-2xl">
      <div className="gov-container flex min-h-[76px] items-center justify-between gap-4 py-3">
        <button
          onClick={() => handleLinkClick("home")}
          className="flex items-center justify-center hover:scale-[1.02]"
          aria-label="Go to homepage"
        >
          <NimcLogo size="responsive" showSubtitle={false} />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/78 px-2 py-2 shadow-[0_18px_50px_rgba(29,29,31,0.10)] backdrop-blur-2xl">
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-[#075f3c] text-white shadow-sm"
                      : "text-stone-600 hover:bg-[#f5f5f7] hover:text-stone-950"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden h-7 w-px bg-[#e5e5ea] lg:block" />

          <AccessibilityToolbar
            settings={accessibilitySettings}
            onUpdateSettings={onUpdateAccessibility}
            currentPageTitle={pageTitle}
            currentPageSummary={pageSummary}
          />

          <a
            href={`tel:${OFFICE_INFO.primaryPhone}`}
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] text-stone-900 hover:bg-[#e8e8ed] sm:inline-flex"
            aria-label="Call Atlanta office"
          >
            <PhoneCall className="h-4 w-4" />
          </a>

          <button
            onClick={onOpenBooking}
            className="btn-primary hidden whitespace-nowrap px-4 py-2.5 text-sm sm:inline-flex"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Book visit</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] text-stone-900 hover:bg-[#e8e8ed] lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="gov-container pb-4 lg:hidden">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/92 p-2 shadow-[0_18px_50px_rgba(29,29,31,0.12)] backdrop-blur-2xl">
            <nav className="space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                      isActive
                        ? "bg-[#075f3c] text-white"
                        : "text-stone-800 hover:bg-[#f5f5f7]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                );
              })}
            </nav>

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#eeeeef] pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="btn-primary py-2.5 text-xs"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Book visit
              </button>
              <a
                href={`tel:${OFFICE_INFO.primaryPhone}`}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 py-2.5 text-xs font-bold text-stone-900 hover:bg-[#e8e8ed]"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Call
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
