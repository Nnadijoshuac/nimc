import {
  OfficeContact,
  FaqItem,
  EnrollmentStep,
  PolicySection,
  StatutoryFee,
} from "../types";

export const OFFICE_INFO: OfficeContact = {
  companyName: "Gateway",
  tagline: "NIMC diaspora enrolment support in Atlanta",
  partnershipText:
    "Licensed diaspora enrolment partner supporting National Identity Management Commission (NIMC) services",
  address: "1 GLENLAKE PARKWAY, SUITE 702",
  suite: "SUITE 702",
  cityStateZip: "ATLANTA, 30328, GEORGIA",
  primaryPhone: "+1 (404) 563-1228",
  secondaryPhone: "+1 (678) 508-7689",
  primaryEmail: "info@ninsupportatlanta.com",
  secondaryEmail: "soniaedwinbiayeibo@gmail.com",
  website: "www.ninsupportatlanta.com",
  hours: {
    weekdays: "Monday – Friday: 9:00 AM – 5:00 PM EST",
    saturday: "Saturday: 10:00 AM – 3:00 PM EST (By Appointment)",
    sunday: "Sunday: Closed",
  },
  dpo: {
    name: "Mr. Johnson Brendan",
    email: "info@ninsupportatlanta.com",
    phone: "+1 (404) 563-1228",
    effectiveDate: "January 1, 2023",
  },
};

export const ENROLLMENT_STEPS: EnrollmentStep[] = [
  {
    stepNumber: 1,
    title: "Pre-Enrollment & Online Payment",
    shortDesc:
      "Download official form and make the required online diaspora fee payment.",
    fullDesc:
      "Visit www.ninsupportatlanta.com to pre-enrol by downloading the standard NIN enrollment form. Print it, fill out all required fields, and bring it with you. Diaspora applicants must complete payment online through the verified portal before arriving for biometrics.",
    requiredActions: [
      "Download official NIMC Diaspora Enrollment Form (PDF)",
      "Fill out personal information in legible block letters",
      "Process online fee payment through the official portal",
      "Do NOT pay cash to any unauthorized third party",
    ],
    tips: "Call our customer care desk at +1 (404) 563-1228 if you have any questions regarding diaspora pre-enrolment categories.",
    badge: "Step 1: Digital",
  },
  {
    stepNumber: 2,
    title: "Generate Official Payment Receipt",
    shortDesc: "Save and print your transaction confirmation receipt.",
    fullDesc:
      "Immediately after completing your payment online, generate and download your official transaction receipt. Kindly save this receipt to your smartphone, tablet, or laptop, or print a physical copy. This verified receipt is strictly required for biometric admission.",
    requiredActions: [
      "Save digital PDF receipt to phone/tablet",
      "Print at least one physical copy of payment receipt",
      "Verify the applicant name matches your identification documents",
    ],
    tips: "Keep your transaction reference code handy for speedy verification at reception.",
    badge: "Step 2: Confirmation",
  },
  {
    stepNumber: 3,
    title: "Visit Atlanta Office with Supporting Documents",
    shortDesc:
      "Walk into 1 Glenlake Pkwy, Suite 702 with your ID, filled form, and receipt.",
    fullDesc:
      "Walk into our dedicated NIN Enrollment center in Atlanta with your valid primary identification document, your filled pre-enrollment form, and your payment confirmation receipt.",
    requiredActions: [
      "Bring valid Nigerian International Passport OR US Passport / Green Card",
      "Bring completed pre-enrollment form",
      "Bring printed online payment receipt",
    ],
    tips: "Walk-ins may be accommodated during standard business hours; booking an appointment helps reduce waiting time.",
    badge: "Step 3: Arrival",
  },
  {
    stepNumber: 4,
    title: "Enrollment Officer Verification & Data Entry",
    shortDesc:
      "Proper verification of records and entry into the NIMC terminal.",
    fullDesc:
      "The applicant is escorted to a certified NIMC Enrollment Officer for identity verification. If you have not pre-filled the form, a copy will be provided on site. The Enrollment Officer inputs your biographical data into the secured NIMC terminal. The applicant must review and confirm that all details are accurate.",
    requiredActions: [
      "Review on-screen spelling of full legal names, date of birth, and state of origin",
      "Confirm contact telephone and active email address",
      "Acknowledge correctness before biometric capture begins",
    ],
    tips: "Double check name sequence (Surname, First Name, Middle Name) to match your passport exactly.",
    badge: "Step 4: Verification",
  },
  {
    stepNumber: 5,
    title: "Biometric Capture & Document Scanning",
    shortDesc:
      "Headshot photograph, 10-fingerprints capture, and digital signature.",
    fullDesc:
      "Applicant submits supporting documents (means of identification, school certificates, birth certificates, etc.) for official document scanning. Original documents are scanned and immediately returned to you. The officer captures your biometrics (live facial headshot photograph, 10 rolled fingerprints) and records your digital signature.",
    requiredActions: [
      "Document scanning (originals returned immediately)",
      "High-resolution facial biometric portrait capture",
      "10-fingerprint biometric live scan",
      "Digital electronic signature capture",
    ],
    tips: "Keep your face clearly visible for standard biometric photo capture.",
    badge: "Step 5: Biometrics",
  },
  {
    stepNumber: 6,
    title: "On-the-Spot NIN Issuance & Transaction Slip",
    shortDesc:
      "Receive your 11-digit National Identification Number immediately.",
    fullDesc:
      "Upon successful biometric capture and server synchronization, applicant is issued a Transaction Slip and issued ON THE SPOT your official National Identification Number (NIN). The slip displays your unique 11-digit number in the top-left corner, second row. This official slip is valid for all legitimate transactions in Nigeria and worldwide.",
    requiredActions: [
      "Receive official NIMC Diaspora Transaction Slip immediately",
      "Verify your 11-digit NIN printed on the slip",
      "Receive notification instructions for future National e-ID Smart Card pickup",
    ],
    tips: "Most completed diaspora applicants receive their NIN slip after processing at the Atlanta center.",
    badge: "Step 6: Instant Issue",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-nimc",
    question: "What is NIMC (National Identity Management Commission)?",
    answer:
      "The NIMC (pronounced as 'Neem-See') is the primary legal institution in Nigeria mandated by law to institutionalize the national identity management system and regulate the identity sector, pursuant to the NIMC Act 2007 (Sections 1, 2, 5, and 6).",
    category: "about-nimc",
  },
  {
    id: "nimc-mandate",
    question: "What is the NIMC Mandate?",
    answer:
      "The statutory NIMC Mandate comprises the following key responsibilities:",
    category: "about-nimc",
    bulletPoints: [
      "To operate and manage the National Identity Management System (NIMS).",
      "Carry out enrolment of citizens and legal residents and issue a unique National Identification Number (NIN).",
      "After enrolment, issue a National e-ID Card (also called a Smart General Multi-Purpose Card - GMPC).",
      "Manage the secure National Identity Database (NIDB).",
      "Harmonize and integrate all disparate databases across the country into one centralized identity database.",
      "Verification and authentication of citizens' identity via secure digital platforms provided by NIMC.",
    ],
  },
  {
    id: "what-is-nims",
    question: "What is National Identity Management System (NIMS)?",
    answer:
      "The National Identity Management System (NIMS) is the comprehensive technological, procedural, and institutional infrastructure responsible for the operational management of the statutory NIMC mandate.",
    category: "about-nimc",
  },
  {
    id: "benefits-of-nims",
    question: "What are the benefits of the NIMS?",
    answer:
      "The National Identity Management System establishes seven fundamental societal and economic benefits:",
    category: "about-nimc",
    bulletPoints: [
      "1. Uniquely identifying individuals with biometric verification.",
      "2. Providing an inclusive platform where no one is excluded socially or financially.",
      "3. Transforming the delivery of social welfare programs, especially for those previously underserved.",
      "4. Enabling citizens and residents to securely claim their legal entitlements.",
      "5. Eliminating duplicate and ghost identities across national institutions.",
      "6. Eradicating identity fraud and cyber-impersonation.",
      "7. Drastically reducing the national cost of public resources through shared infrastructure.",
    ],
  },
  {
    id: "what-is-nin",
    question: "What is the National Identification Number (NIN)?",
    answer:
      "The National Identification Number — NIN (pronounced as 'Neen') is a unique 11-digit number issued to an individual upon successful biometric and demographic enrolment. This number is randomly generated and is issued to you for life.",
    category: "about-nin",
  },
  {
    id: "nin-usage",
    question: "What is the NIN used for?",
    answer:
      "The NIN ties all records about an individual into the National Identity Database (NIDB). It is required by law as a valid, incontrovertible means of establishing or verifying individual identity for Nigerian passport renewal, banking transactions, land registries, driver's licenses, and government services.",
    category: "about-nin",
  },
  {
    id: "how-to-get-nin",
    question: "How do I get my NIN?",
    answer:
      "Upon successful completion of enrolment and biometric capture at our Atlanta center, an official Transaction Slip is issued. Applicants residing in the diaspora receive their NIN on the spot immediately after biometrics submission.",
    category: "about-nin",
  },
  {
    id: "who-should-register",
    question: "Who should register and get a NIN?",
    answer:
      "All citizens of Nigeria (at home and abroad in the diaspora) as well as legal permanent residents of Nigeria are eligible and legally required to enroll for their National Identification Number (NIN). Children of all ages, including newborns, are also eligible.",
    category: "about-nin",
  },
  {
    id: "forgotten-nin",
    question: "Do I need to re-enroll if I forget my NIN?",
    answer:
      "No. You do NOT need to enroll again. Once a NIN is assigned, it remains yours for life. Enrolling a second time is illegal and will be rejected by the biometric matching system.",
    category: "retrieval",
    bulletPoints: [
      "Visit our Gateway Atlanta Enrollment Center and provide your registered telephone number, date of birth, or fingerprint verification — your NIN will be retrieved for you immediately.",
      "Individuals in Nigeria can retrieve their NIN instantly using USSD code *346# on any GSM network (nominal standard telecom charge applies).",
      "Retrieval can also be performed using the phone number supplied during initial enrollment or via biographical key information search.",
    ],
  },
  {
    id: "lost-nin-slip",
    question: "I have lost my NIN slip, how can I obtain another one?",
    answer:
      "If your NIN slip is lost, damaged, or misplaced, you can obtain an authentic reprint at our Atlanta office. Applicants pay a nominal statutory token fee for slip verification and printing. Once your identity is verified and payment confirmed, your official slip will be re-issued and printed immediately on the spot.",
    category: "retrieval",
    referenceLink: {
      text: "View official NIMC Diaspora Enrolment Fact Sheet",
      url: "https://www.nimc.gov.ng/docs/diasporaEnrolmentFactS.pdf",
    },
  },
];

export const DATA_PROTECTION_SECTIONS: PolicySection[] = [
  {
    id: "introduction",
    number: "1",
    title: "Introduction",
    content:
      "At Gateway, we understand the paramount importance of safeguarding sensitive information, particularly biometric data, entrusted to us by our valued clients. This Data Protection Policy outlines our commitment to ensuring the utmost security, confidentiality, and integrity of all data we collect, process, or store. We are dedicated to adhering to the highest standards of data protection, and this policy serves as a testament to our unwavering dedication to this cause.",
  },
  {
    id: "scope",
    number: "2",
    title: "Scope",
    content:
      "This policy applies to all employees, contractors, partners, and third parties who are involved in the collection, processing, or management of data within Gateway. It also encompasses all systems, applications, processes, and services that involve the handling of sensitive identity information.",
  },
  {
    id: "principles",
    number: "3",
    title: "Principles of Data Protection",
    content:
      "Our data protection approach is strictly underpinned by the following seven core statutory principles:",
    subsections: [
      {
        number: "3.1",
        title: "Lawfulness, Fairness, and Transparency",
        description:
          "We commit to collecting and processing data lawfully (as captured within the NIMC Act 2007), with transparency and fairness, and ensuring that individuals are fully informed of how their data will be processed.",
      },
      {
        number: "3.2",
        title: "Purpose Limitation",
        description:
          "We gather data only for specific, explicit, and legitimate purposes (in this case for diaspora enrollment, verification, and statutory NIMS identity services) and do not process it in any way incompatible with these purposes.",
      },
      {
        number: "3.3",
        title: "Data Minimization",
        description:
          "We only collect and retain demographic and biometric data that is strictly necessary for the fulfillment of our authorized enrollment mandates, and continually minimize personal data handling.",
      },
      {
        number: "3.4",
        title: "Accuracy",
        description:
          "We take every reasonable measure to ensure that the data we hold is accurate, up-to-date, and relevant. Clients are encouraged to inform our enrollment officers of any changes or inaccuracies.",
      },
      {
        number: "3.5",
        title: "Storage Limitation",
        description:
          "We retain personal data only for as long as it is necessary to fulfill statutory mandates, in strict accordance with applicable national identity regulations and records disposal standards.",
      },
      {
        number: "3.6",
        title: "Integrity and Confidentiality",
        description:
          "We implement robust technical and organizational security measures to protect the confidentiality, integrity, and availability of data, preventing unauthorized access, alteration, or disclosure. (Our digital portal is 256-bit SSL encrypted).",
      },
      {
        number: "3.7",
        title: "Accountability",
        description:
          "We take full responsibility for complying with data protection laws and regulations under the NIMC Act, demonstrating accountability through documented procedures and regular independent compliance auditing.",
      },
    ],
  },
  {
    id: "security-measures",
    number: "4",
    title: "Data Security Measures",
    content:
      "We recognize that the security of sensitive information is of paramount importance to our clients and authorities alike. To that end, we have implemented a comprehensive set of data security measures, including but not limited to:",
    subsections: [
      {
        number: "4.1",
        title: "End-to-End Encryption",
        description:
          "All sensitive data, including facial portraits and 10-finger biometric information, is encrypted both during transmission to the NIMC database and during local storage using AES-256.",
      },
      {
        number: "4.2",
        title: "Strict Access Controls",
        description:
          "We implement multi-factor authentication and role-based access controls, ensuring that only vetted, certified Enrollment Officers have access to enrollment workstations.",
      },
      {
        number: "4.3",
        title: "Regular Audits and Assessments",
        description:
          "Our enrollment systems, hardware terminals, and network gateways undergo regular vulnerability assessments and security audits.",
      },
      {
        number: "4.4",
        title: "Rigorous Employee Training",
        description:
          "All personnel undergo continuous data protection and privacy compliance training to uphold professional secrecy and confidentiality.",
      },
    ],
  },
  {
    id: "client-rights",
    number: "5",
    title: "Clients Rights",
    content:
      "We respect the rights of our clients in relation to their personal data. This includes the right to access, rectify, erase, and restrict the processing of their data in accordance with statutory guidelines. Clients can exercise these rights by contacting our Data Protection Officer.",
  },
  {
    id: "data-breaches",
    number: "6",
    title: "Reporting Data Breaches",
    content:
      "In the event of a data breach that poses a risk to individuals' rights and freedoms, we commit to notifying the relevant regulatory authorities and affected individuals within the timelines stipulated by applicable data protection laws.",
  },
  {
    id: "compliance",
    number: "7",
    title: "Compliance and Accountability",
    content:
      "Gateway is committed to maintaining continuous compliance with all applicable data protection laws. Our designated Data Protection Officers oversee compliance efforts, answer client inquiries, and serve as the liaison with regulatory authorities.",
  },
  {
    id: "continuous-improvement",
    number: "8",
    title: "Continuous Improvement",
    content:
      "We understand that data security is an evolving responsibility. As technology and cyber threats advance, we continuously upgrade our defenses and physical office protocols to deliver the highest degree of security.",
  },
];

export const REQUIRED_DOCUMENTS = [
  {
    title: "Nigerian International Passport",
    description:
      "Original valid or expired Nigerian passport (data page with photo).",
    required: true,
    category: "primary",
  },
  {
    title: "Foreign Passport / Resident Card",
    description:
      "US Passport, Permanent Resident Card (Green Card), or valid US Visa.",
    required: true,
    category: "primary",
  },
  {
    title: "Completed Pre-Enrolment Form",
    description:
      "Legibly filled NIN pre-enrollment form downloaded from our portal.",
    required: true,
    category: "form",
  },
  {
    title: "Proof of Payment Receipt",
    description:
      "Printed confirmation slip or digital receipt from online payment.",
    required: true,
    category: "payment",
  },
  {
    title: "Supporting Secondary Document",
    description:
      "Birth Certificate, National Declaration of Age, or School Certificate.",
    required: false,
    category: "secondary",
  },
  {
    title: "For Minors (Under 16)",
    description:
      "Parent's/Guardian's NIN, Child's Birth Certificate, and Parent's consent.",
    required: false,
    category: "minor",
  },
];

export const STATUTORY_FEES: StatutoryFee[] = [
  {
    service: "Adult First-Time Enrolment (16+)",
    fee: "$50.00",
    notes:
      "Includes 10-finger biometric capture, facial portrait, and standard official NIN slip issuance.",
  },
  {
    service: "Minor & Child Enrolment (0–15)",
    fee: "$40.00",
    notes:
      "Requires verified parent/guardian NIN and birth certificate. Essential for Nigerian passport processing.",
  },
  {
    service: "Demographic Data Modification",
    fee: "$50.00",
    notes:
      "Updates to phone numbers, address, marital status, or surname correction with document verification.",
  },
  {
    service: "Lost Slip Retrieval & Reprint",
    fee: "$20.00",
    notes:
      "Biometric database lookup against the National Identity Database (NIDB) and immediate slip reprint.",
  },
];
