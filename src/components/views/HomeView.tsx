import React from "react";
import {
  MapPin,
  Calendar,
  PhoneCall,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  Fingerprint,
  RefreshCw,
  ChevronRight,
  Building2,
  Users,
  ShieldCheck,
} from "../icons";
import {
  ENROLLMENT_STEPS,
  OFFICE_INFO,
  STATUTORY_FEES,
} from "../../data/websiteContent";
import { PageId } from "../../types";
import heroNigerianCouple from "../../assets/hero-nigerian-couple.jpg";
import heroTraditionalCouple from "../../assets/hero-traditional-couple.jpg";
import heroYorubaFamily from "../../assets/hero-yoruba-family.jpg";
import heroIgboWedding from "../../assets/hero-igbo-wedding.jpg";
import heroFatherAndSons from "../../assets/hero-father-and-sons.jpg";
import heroNewbornWelcome from "../../assets/hero-newborn-welcome.jpg";

interface HomeViewProps {
  onNavigate: (page: PageId) => void;
  onOpenBooking: () => void;
  onOpenPreEnroll: () => void;
}

const servicePanels = [
  {
    title: "New NIN enrolment",
    body: "Complete your first-time diaspora registration with document review, portrait capture, and fingerprints.",
    icon: Fingerprint,
    action: "Start pre-enrolment",
  },
  {
    title: "Children and family visits",
    body: "Prepare minors and family groups with the right guardian documents before arriving.",
    icon: Users,
    action: "Book family visit",
  },
  {
    title: "Slip retrieval",
    body: "Get help with existing NIN slip retrieval, reprint, and verification questions.",
    icon: RefreshCw,
    action: "View requirements",
  },
];

/**
 * Hero photography.
 *
 * The art is full-bleed and a feathered gradient carries the headline column,
 * so nothing here should introduce a hard edge. Each slide instead carries:
 *  - `focal`, the object-position that keeps faces to the right of the copy;
 *  - `label`, the caption shown beside the pagination;
 *  - `drift`, the direction the Ken Burns pan travels, alternated between
 *    neighbours so consecutive slides never move the same way.
 */
const heroSlides = [
  {
    src: heroNigerianCouple,
    alt: "Nigerian couple in traditional attire smiling outdoors",
    label: "Diaspora families",
    focal: "72% center",
    drift: "right",
  },
  {
    src: heroYorubaFamily,
    // Studio portrait, subjects slightly left of centre with open backdrop
    // to the upper right — pulled right so the group clears the headline.
    alt: "Mother and her two sons in matching Yoruba agbada and aso oke caps",
    label: "Yoruba heritage",
    focal: "55% center",
    drift: "left",
  },
  {
    src: heroIgboWedding,
    // Shallow depth of field with the couple just left of centre; the crop
    // pushes right so the groom's cap and the bride both stay in frame.
    alt: "Igbo couple at a traditional wedding in red okpu agu cap, coral beads, and bridal veil",
    label: "Igbo tradition",
    focal: "60% center",
    drift: "right",
  },
  {
    src: heroFatherAndSons,
    // Subjects span the full width; a hard right crop would clip the
    // youngest child, so this one sits closer to the middle.
    alt: "Father and his three sons in embroidered agbada outside their home",
    label: "Northern Nigeria",
    focal: "62% center",
    drift: "left",
  },
  {
    src: heroNewbornWelcome,
    alt: "Family in traditional dress laughing together as they welcome a newborn",
    label: "New arrivals",
    focal: "58% center",
    drift: "right",
  },
  {
    src: heroTraditionalCouple,
    alt: "Couple in coordinated traditional African attire",
    label: "Every generation",
    focal: "72% center",
    drift: "left",
  },
];

/** How long each slide holds before the crossfade to the next one begins. */
const SLIDE_DURATION_MS = 7000;

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenBooking,
  onOpenPreEnroll,
}) => {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [slideshowPaused, setSlideshowPaused] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Keyed on activeSlide rather than an interval, so choosing a slide from the
  // pagination restarts the hold instead of cutting it short.
  React.useEffect(() => {
    if (reduceMotion || slideshowPaused) return;

    const timer = window.setTimeout(
      () => setActiveSlide((current) => (current + 1) % heroSlides.length),
      SLIDE_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [activeSlide, slideshowPaused, reduceMotion]);

  return (
    <div className="pb-24">
      <section
        aria-labelledby="hero-title"
        className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-white"
      >
        {/*
          The art is deliberately full-bleed. An inset image panel leaves a
          visible vertical seam where it stops, so legibility is handled purely
          by the feathered gradients below — no clipped edges, no banding.
        */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0">
            {heroSlides.map((slide, index) => (
              <img
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="hero-slide"
                data-active={index === activeSlide ? "true" : undefined}
                data-drift={slide.drift}
                style={{ objectPosition: slide.focal }}
              />
            ))}
          </div>

          {/*
            Below lg the copy sits over the full width of the photo, so the
            wash runs top-to-bottom: dense behind the headline, opening up
            further down where the art can breathe.
          */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.94)_38%,rgba(255,255,255,0.86)_56%,rgba(255,255,255,0.6)_74%,rgba(255,255,255,0.4)_100%)] lg:hidden" />

          {/*
            From lg the copy has its own column, so the wash runs left-to-right
            with many stops — the falloff has to read as light, not as a panel.
          */}
          <div className="absolute inset-0 hidden lg:block lg:bg-[linear-gradient(to_right,#ffffff_0%,rgba(255,255,255,0.97)_14%,rgba(255,255,255,0.9)_26%,rgba(255,255,255,0.76)_36%,rgba(255,255,255,0.55)_46%,rgba(255,255,255,0.34)_56%,rgba(255,255,255,0.16)_68%,rgba(255,255,255,0.05)_80%,rgba(255,255,255,0)_92%)]" />

          {/* Vertical settle into the page background. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#f5f5f7_0%,rgba(245,245,247,0.6)_12%,rgba(245,245,247,0)_34%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.28)_100%)]" />
        </div>

        <div className="gov-container relative flex min-h-[calc(100svh-76px)] items-center py-14 sm:py-20">
          <div className="max-w-xl pt-4">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full bg-white/82 px-3 py-1.5 text-xs font-semibold text-[#075f3c] shadow-sm ring-1 ring-black/5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#0a7a4b]" />
              For Nigerians in the diaspora
            </div>

            <h1
              id="hero-title"
              className="text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-stone-950 sm:text-7xl lg:text-[5.2rem]"
            >
              Your NIN visit, handled with calm.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
              Start online, visit the Atlanta office for verification and
              biometrics, and get clear guidance from arrival to slip support.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onOpenPreEnroll}
                className="btn-primary px-6 py-3.5 text-sm"
              >
                <FileText className="h-4 w-4" />
                Start pre-enrolment
              </button>
              <button
                onClick={onOpenBooking}
                className="btn-secondary px-6 py-3.5 text-sm"
              >
                <Calendar className="h-4 w-4" />
                Book visit
              </button>
              <button
                onClick={() => onNavigate("how-to-enroll")}
                className="inline-flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-semibold text-[#075f3c] hover:underline"
              >
                See how it works
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl gap-px overflow-hidden rounded-2xl bg-black/[0.06] shadow-sm ring-1 ring-black/5 sm:grid-cols-3">
              {[
                ["Location", "1 Glenlake Parkway, Suite 702"],
                ["Process", "Pre-enrolment, review, biometrics"],
                ["Support", "NIN slip retrieval and guidance"],
              ].map(([label, body]) => (
                <div key={label} className="bg-white/86 p-4 backdrop-blur-md">
                  <div className="text-xs font-semibold text-[#075f3c]">
                    {label}
                  </div>
                  <div className="mt-1 text-sm font-medium leading-6 text-stone-700">
                    {body}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-10 flex items-center gap-4"
              onMouseEnter={() => setSlideshowPaused(true)}
              onMouseLeave={() => setSlideshowPaused(false)}
              onFocusCapture={() => setSlideshowPaused(true)}
              onBlurCapture={() => setSlideshowPaused(false)}
            >
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Hero images"
              >
                {heroSlides.map((slide, index) => {
                  const isActive = index === activeSlide;
                  return (
                    <button
                      key={slide.src}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={slide.label}
                      onClick={() => setActiveSlide(index)}
                      className={`group relative h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a7a4b] ${
                        isActive
                          ? "w-10 bg-[#0a7a4b]/22"
                          : "w-1.5 bg-stone-900/22 hover:bg-stone-900/40"
                      }`}
                    >
                      {isActive && (
                        <span
                          // Remounting on slide change restarts the fill.
                          key={activeSlide}
                          className="hero-dot-fill absolute inset-0 origin-left rounded-full bg-[#0a7a4b]"
                          style={
                            {
                              "--hero-slide-duration": `${SLIDE_DURATION_MS}ms`,
                              animationPlayState: slideshowPaused
                                ? "paused"
                                : "running",
                            } as React.CSSProperties
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <span
                className="text-xs font-medium text-stone-500"
                aria-live="polite"
              >
                {heroSlides[activeSlide].label}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="services-title"
        className="gov-container py-16 sm:py-20"
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="kicker">Services</div>
            <h2
              id="services-title"
              className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-5xl"
            >
              Everything for your visit.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-stone-600">
            Pick the service you need, prepare your documents, and arrive ready
            for biometric capture.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {servicePanels.map((service, index) => {
            const Icon = service.icon;
            const action =
              index === 0
                ? onOpenPreEnroll
                : index === 1
                  ? onOpenBooking
                  : () => onNavigate("faq");

            return (
              <article
                key={service.title}
                className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="mb-12 flex items-center justify-between">
                  <div className="rounded-full bg-[#eef8f2] p-3 text-[#0a7a4b]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] text-stone-950">
                  {service.title}
                </h3>
                <p className="mt-3 min-h-20 text-sm leading-7 text-stone-600">
                  {service.body}
                </p>
                <button
                  onClick={action}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#075f3c] hover:underline"
                >
                  {service.action}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="steps-title"
        className="gov-container pb-16 sm:pb-20"
      >
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="kicker">How it works</div>
              <h2
                id="steps-title"
                className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-5xl"
              >
                A clear path from form to slip.
              </h2>
            </div>
            <button
              onClick={() => onNavigate("how-to-enroll")}
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#075f3c] hover:underline"
            >
              Full guide
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ENROLLMENT_STEPS.slice(0, 6).map((step) => (
              <div
                key={step.stepNumber}
                className="rounded-2xl bg-[#f5f5f7] p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#075f3c]">
                    Step {step.stepNumber}
                  </span>
                  <ShieldCheck className="h-4 w-4 text-[#0a7a4b]" />
                </div>
                <h3 className="text-base font-semibold text-stone-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {step.shortDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="fees-title"
        className="gov-container pb-16 sm:pb-20"
      >
        <div className="mb-8 text-center">
          <div className="kicker mx-auto">Fees</div>
          <h2
            id="fees-title"
            className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-5xl"
          >
            Know the cost before you come in.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {STATUTORY_FEES.map((item) => (
            <div
              key={item.service}
              className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-stone-950">
                  {item.service}
                </h3>
                <div className="shrink-0 text-3xl font-semibold text-[#075f3c]">
                  {item.fee}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-600">
                {item.notes}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="office-title" className="gov-container pb-20">
        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
            <div className="kicker">Office visit</div>
            <h2
              id="office-title"
              className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-stone-950"
            >
              Come in prepared. Leave with answers.
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              The center is near GA-400 and I-285. Bring your completed forms,
              identification, and payment confirmation.
            </p>

            <div className="mt-8 space-y-5 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7a4b]" />
                <div>
                  <div className="font-semibold text-stone-950">
                    {OFFICE_INFO.address}
                  </div>
                  <div className="text-stone-600">
                    {OFFICE_INFO.cityStateZip}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7a4b]" />
                <div>
                  <div className="font-semibold text-stone-950">
                    Monday-Friday, 9:00 AM-5:00 PM EST
                  </div>
                  <div className="text-stone-600">
                    Saturday appointments may be available by prior booking.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-[#0a7a4b]" />
                <div>
                  <a
                    href={`tel:${OFFICE_INFO.primaryPhone}`}
                    className="font-semibold text-[#075f3c] hover:underline"
                  >
                    {OFFICE_INFO.primaryPhone}
                  </a>
                  <div className="text-stone-600">
                    {OFFICE_INFO.primaryEmail}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenBooking}
              className="btn-primary mt-8 px-5 py-3 text-sm"
            >
              <Calendar className="h-4 w-4" />
              Book office visit
            </button>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
            <div className="relative h-full min-h-[24rem] bg-stone-100">
              <img
                src="https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=1400&q=85"
                alt="Bright office waiting area for appointment visits"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/70 to-transparent p-6 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4" />
                  Comfortable in-person support
                </div>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                  Check in, confirm your documents, complete biometrics, and get
                  help with next steps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
