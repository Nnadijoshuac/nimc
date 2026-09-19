export type PageId = "home" | "how-to-enroll" | "faq" | "data-protection";

export interface OfficeContact {
  companyName: string;
  tagline: string;
  partnershipText: string;
  address: string;
  suite: string;
  cityStateZip: string;
  primaryPhone: string;
  secondaryPhone: string;
  primaryEmail: string;
  secondaryEmail: string;
  website: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  dpo: {
    name: string;
    email: string;
    phone: string;
    effectiveDate: string;
  };
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "about-nimc" | "about-nin" | "retrieval" | "diaspora";
  importantNotice?: string;
  bulletPoints?: string[];
  referenceLink?: {
    text: string;
    url: string;
  };
}

export interface EnrollmentStep {
  stepNumber: number;
  title: string;
  shortDesc: string;
  fullDesc: string;
  requiredActions: string[];
  tips?: string;
  badge?: string;
}

export interface PolicySection {
  id: string;
  number: string;
  title: string;
  content: string;
  subsections?: {
    number: string;
    title: string;
    description: string;
  }[];
}

export interface AccessibilitySettings {
  fontScale: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderGuide?: boolean;
}

export interface StatutoryFee {
  service: string;
  fee: string;
  notes: string;
}
