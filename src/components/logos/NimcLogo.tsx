import React from "react";
import nimcLogo from "../../assets/nimc_logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "responsive";
  showSubtitle?: boolean;
}

export const NimcLogo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  showSubtitle = true,
}) => {
  const sizeClass = {
    sm: "h-9 w-16",
    md: "h-12 w-24",
    lg: "h-16 w-32",
    responsive: "h-11 w-24 sm:h-12 sm:w-28",
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      role="img"
      aria-label="National Identity Management Commission (NIMC) logo"
    >
      <img
        src={nimcLogo}
        alt="National Identity Management Commission logo"
        className={`${sizeClass} object-contain`}
        loading="eager"
      />

      {showSubtitle && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[11px] font-semibold text-emerald-800 sm:text-xs">
            National Identity
          </span>
          <span className="text-[10px] font-medium tracking-normal text-stone-600 sm:text-[11px]">
            Management Commission
          </span>
          <span className="mt-0.5 text-[9px] font-semibold text-emerald-600/90">
            Federal Republic of Nigeria
          </span>
        </div>
      )}
    </div>
  );
};
