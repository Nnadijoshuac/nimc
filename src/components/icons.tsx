import React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AccessibilityIcon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  Award01Icon,
  Building03Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  CreditCardIcon,
  Download04Icon,
  File01Icon,
  FingerPrintIcon,
  HelpCircleIcon,
  Home09Icon,
  LinkSquare02Icon,
  Location01Icon,
  Mail01Icon,
  Menu01Icon,
  PrinterIcon,
  RefreshIcon,
  RotateLeft01Icon,
  Search01Icon,
  SecurityValidationIcon,
  SecurityWarningIcon,
  SquareIcon,
  SquareLock01Icon,
  TelephoneIcon,
  TextFontIcon,
  Tick02Icon,
  UserCheck01Icon,
  UserGroupIcon,
  ViewIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Hugeicons rendered through a Lucide-compatible surface.
 *
 * Every icon here takes the same props the rest of the app already passes
 * (`className="h-4 w-4"`, `aria-hidden`, `strokeWidth`), so call sites stay
 * unchanged. Sizing comes from the Tailwind classes, not the `size` prop.
 */

type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  strokeWidth?: number;
};

const icon = (svg: IconSvgElement, displayName: string) => {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ strokeWidth = 1.8, ...props }, ref) => (
      <HugeiconsIcon
        ref={ref}
        icon={svg}
        strokeWidth={strokeWidth}
        {...props}
      />
    ),
  );
  Component.displayName = displayName;
  return Component;
};

export const Accessibility = icon(AccessibilityIcon, "Accessibility");
export const ArrowRight = icon(ArrowRight02Icon, "ArrowRight");
export const ArrowUp = icon(ArrowUp02Icon, "ArrowUp");
export const Award = icon(Award01Icon, "Award");
export const Building2 = icon(Building03Icon, "Building2");
export const Calendar = icon(Calendar03Icon, "Calendar");
export const CalendarCheck = icon(CalendarCheckIn01Icon, "CalendarCheck");
export const Check = icon(Tick02Icon, "Check");
export const CheckCircle = icon(CheckmarkCircle02Icon, "CheckCircle");
export const CheckCircle2 = icon(CheckmarkCircle02Icon, "CheckCircle2");
export const CheckSquare = icon(CheckmarkSquare01Icon, "CheckSquare");
export const ChevronDown = icon(ArrowDown01Icon, "ChevronDown");
export const ChevronRight = icon(ArrowRight02Icon, "ChevronRight");
export const ChevronUp = icon(ArrowUp01Icon, "ChevronUp");
export const Clock = icon(Clock01Icon, "Clock");
export const CreditCard = icon(CreditCardIcon, "CreditCard");
export const Download = icon(Download04Icon, "Download");
export const ExternalLink = icon(LinkSquare02Icon, "ExternalLink");
export const Eye = icon(ViewIcon, "Eye");
export const FileText = icon(File01Icon, "FileText");
export const Fingerprint = icon(FingerPrintIcon, "Fingerprint");
export const HelpCircle = icon(HelpCircleIcon, "HelpCircle");
export const Home = icon(Home09Icon, "Home");
export const Lock = icon(SquareLock01Icon, "Lock");
export const Mail = icon(Mail01Icon, "Mail");
export const MapPin = icon(Location01Icon, "MapPin");
export const Menu = icon(Menu01Icon, "Menu");
export const Phone = icon(TelephoneIcon, "Phone");
export const PhoneCall = icon(TelephoneIcon, "PhoneCall");
export const Printer = icon(PrinterIcon, "Printer");
export const RefreshCw = icon(RefreshIcon, "RefreshCw");
export const RotateCcw = icon(RotateLeft01Icon, "RotateCcw");
export const Search = icon(Search01Icon, "Search");
export const ShieldAlert = icon(SecurityWarningIcon, "ShieldAlert");
export const ShieldCheck = icon(SecurityValidationIcon, "ShieldCheck");
export const Square = icon(SquareIcon, "Square");
export const Type = icon(TextFontIcon, "Type");
export const UserCheck = icon(UserCheck01Icon, "UserCheck");
export const Users = icon(UserGroupIcon, "Users");
export const Volume2 = icon(VolumeHighIcon, "Volume2");
export const VolumeX = icon(VolumeMute01Icon, "VolumeX");
export const X = icon(Cancel01Icon, "X");
export const Alert = icon(Alert02Icon, "Alert");
