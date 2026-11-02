import React, { useEffect, useState } from "react";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { NinSupportLogo } from "../components/logos/NinSupportLogo";
import { Alert } from "../components/icons";

type Gate = "loading" | "signed-out" | "not-admin" | "admin";

export default function AdminApp() {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    document.title = "Admin · NIN Support Atlanta";
    setGate("signed-out");
    setSession(null);
  }, []);

  return (
    <Shell>
      <Notice title="Form filling is disabled">
        This admin experience no longer accepts form input. Please use the public
        site information only.
      </Notice>
    </Shell>
  );
}

const emailOtpTypes = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
]);

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  return value && emailOtpTypes.has(value) ? (value as EmailOtpType) : null;
}

function sameOriginPath(value: string | null) {
  if (!value) return "/";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="admin-app flex min-h-screen items-center justify-center px-4 py-10">
    <div className="paper-panel w-full max-w-sm p-6">
      <div className="mb-6 flex items-center gap-3">
        <NinSupportLogo variant="mark" className="h-10 w-10" />
        <div>
          <div className="text-sm font-bold text-stone-950">
            NIN Support back office
          </div>
          <div className="text-xs text-stone-500">Staff only</div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const Notice: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-lg bg-amber-100 p-4 text-xs leading-6 text-amber-950">
    <div className="mb-1 flex items-center gap-2 text-sm font-bold">
      <Alert className="h-4 w-4" />
      {title}
    </div>
    {children}
  </div>
);

function SignIn() {
  return <div className="text-sm text-stone-700">Sign-in form removed.</div>;
}

function RequestAccess() {
  return <div className="text-sm text-stone-700">Access requests are disabled.</div>;
}

function SetPassword() {
  return <div className="text-sm text-stone-700">Password setup is disabled.</div>;
}
