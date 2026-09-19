import React from "react";

interface GatewayLogoProps {
  className?: string;
  variant?: "full" | "icon-only" | "light" | "dark";
}

export const GatewayLogo: React.FC<GatewayLogoProps> = ({
  className = "",
  variant = "full",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      role="img"
      aria-label="Gateway diaspora enrolment support"
    >
      {/* Placeholder partner identity until the final Gateway brand lockup is supplied. */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#075f3c] text-sm font-semibold text-white shadow-sm">
        G
      </div>

      {variant !== "icon-only" && (
        <div className="flex flex-col justify-center text-left leading-tight">
          <span className="text-sm font-semibold text-stone-950">Gateway</span>
          <span className="text-xs font-medium text-stone-500">
            Diaspora support
          </span>
        </div>
      )}
    </div>
  );
};
