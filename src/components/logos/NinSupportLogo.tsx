import React from "react";
import { NimcLogo } from "./NimcLogo";

/**
 * The NIN Support Atlanta brand. Assets live in public/brand so they have
 * stable URLs that emails can load too.
 *
 *   full  emblem + NINSUPPORTATLANTA wordmark (headers, footer)
 *   mark  emblem only, square (compact spots: dialogs, admin, favicon)
 */
interface NinSupportLogoProps {
  className?: string;
  variant?: "full" | "mark" | "icon-only";
}

export const NinSupportLogo: React.FC<NinSupportLogoProps> = ({
  className = "",
  variant = "full",
}) =>
  variant === "full" ? (
    <img
      src="/brand/logo-full.png"
      alt="NIN Support Atlanta"
      width={600}
      height={269}
      className={`h-12 w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  ) : (
    <img
      src="/brand/logo-mark.png"
      alt="NIN Support Atlanta"
      width={256}
      height={256}
      className={`h-10 w-10 select-none object-contain ${className}`}
      draggable={false}
    />
  );

/** "Supported by NIMC": the partner mark, always secondary to our own logo. */
export const SupportedByNimc: React.FC<{
  className?: string;
  label?: string;
}> = ({ className = "", label = "Supported by" }) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
      {label}
    </span>
    <NimcLogo size="sm" showSubtitle={false} />
  </div>
);
