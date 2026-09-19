import React, { useMemo, useState } from "react";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react";
import { FAQ_ITEMS, OFFICE_INFO } from "../../data/websiteContent";

interface FaqViewProps {
  onOpenBooking: () => void;
}

export const FaqView: React.FC<FaqViewProps> = ({ onOpenBooking }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "what-is-nimc": true,
    "what-is-nin": true,
    "how-to-get-nin": true,
  });

  const categories = [
    { id: "all", label: "All" },
    { id: "about-nimc", label: "NIMC and NIMS" },
    { id: "about-nin", label: "NIN" },
    { id: "retrieval", label: "Retrieval" },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.bulletPoints?.some((bullet) =>
          bullet.toLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    FAQ_ITEMS.forEach((item) => {
      allOpen[item.id] = true;
    });
    setOpenItems(allOpen);
  };

  return (
    <div className="gov-container max-w-5xl space-y-10 py-10 sm:py-14">
      <section className="paper-panel p-6 text-center sm:p-8">
        <div className="kicker justify-center">Knowledge base</div>
        <h1 className="mt-2 font-serif-soft text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
          Answers about NIMC, the National Identity Management System, National
          Identification Numbers, lost slips, and diaspora enrolment procedures.
        </p>

        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by topic, e.g. lost slip or passport"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="field-control py-3 pl-12 pr-11 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-950"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4 border-b border-[#eeeeef] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                selectedCategory === category.id
                  ? "border-[#075f3c] bg-[#075f3c] text-white"
                  : "border-[#e5e5ea] bg-white text-stone-700 hover:border-[#c7c7cc]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-stone-600">
          <button
            onClick={expandAll}
            className="hover:text-stone-950 hover:underline"
          >
            Expand all
          </button>
          <span className="text-stone-400">|</span>
          <button
            onClick={() => setOpenItems({})}
            className="hover:text-stone-950 hover:underline"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <article
                key={faq.id}
                id={`faq-card-${faq.id}`}
                className="paper-panel overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-[#f5f5f7]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a7a4b]" />
                    <h2 className="text-base font-semibold text-stone-950 sm:text-lg">
                      {faq.question}
                    </h2>
                  </div>
                  <div className="shrink-0 text-stone-500">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className="space-y-3 border-t border-[#eeeeef] px-5 pb-5 pt-4 text-sm leading-7 text-stone-700"
                  >
                    <p>{faq.answer}</p>

                    {faq.bulletPoints && (
                      <ul className="space-y-2 text-sm">
                        {faq.bulletPoints.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a7a4b]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {faq.importantNotice && (
                      <div className="rounded-lg border border-[#efd088] bg-[#fff9ea] p-3 text-xs font-medium text-stone-800">
                        <strong>Official note:</strong> {faq.importantNotice}
                      </div>
                    )}

                    {faq.referenceLink && (
                      <a
                        href={faq.referenceLink.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075f3c] hover:underline"
                      >
                        {faq.referenceLink.text}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="paper-panel p-10 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-stone-400" />
            <div className="mt-3 font-bold text-stone-900">
              No matching questions found
            </div>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-6 text-stone-600">
              Try a broader search term such as passport, children, slip, or
              enrollment.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="btn-primary mt-4 px-4 py-2 text-xs"
            >
              Reset search
            </button>
          </div>
        )}
      </div>

      <section className="paper-panel flex flex-col gap-5 bg-[#fbfbfd] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h3 className="font-serif-soft text-2xl font-semibold text-stone-950">
            Need help before visiting?
          </h3>
          <p className="mt-1 text-sm leading-6 text-stone-700">
            Call the Atlanta office or reserve a time for in-person biometric
            capture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`tel:${OFFICE_INFO.primaryPhone}`}
            className="btn-primary px-4 py-2.5 text-xs"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            {OFFICE_INFO.primaryPhone}
          </a>
          <button
            onClick={onOpenBooking}
            className="btn-secondary px-4 py-2.5 text-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            Book visit
          </button>
        </div>
      </section>
    </div>
  );
};
