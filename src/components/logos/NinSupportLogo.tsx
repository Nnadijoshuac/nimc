import React from "react";

interface NinSupportLogoProps {
  className?: string;
  variant?: "full" | "icon-only" | "light" | "dark";
}

export const NinSupportLogo: React.FC<NinSupportLogoProps> = ({
  className = "",
  variant = "full",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      role="img"
      aria-label="NIN Support Atlanta"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#075f3c] text-[11px] font-bold tracking-tight text-white shadow-sm">
        NIN
      </div>

      {variant !== "icon-only" && (
        <div className="flex flex-col justify-center text-left leading-tight">
          <span className="text-sm font-semibold text-stone-950">
            NIN Support
          </span>
          <span className="text-xs font-medium text-stone-500">Atlanta</span>
        </div>
      )}
    </div>
  );
};
