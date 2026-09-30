import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { NimcLogo } from "../components/logos/NimcLogo";
import { Alert, CheckCircle, Lock, Mail, Users } from "../components/icons";
import { Spinner } from "../components/FormBits";
import { Dashboard } from "./Dashboard";

type Gate = "loading" | "signed-out" | "not-admin" | "admin";

/**
 * Back office root: session handling and the admin gate. Being signed in is
 * not enough; the user must also have a row in public.admins, which is what
 * row level security checks on every query.
 */
export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [gate, setGate] = useState<Gate>("loading");
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    document.title = "Admin · NIN Support Atlanta";
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    if (!session) {
      setGate("signed-out");
      return;
    }
    setGate("loading");
    supabase.rpc("is_admin").then(({ data, error }) => {
      setGate(!error && data === true ? "admin" : "not-admin");
    });
  }, [session?.user.id]);

  if (!supabase) {
    return (
      <Shell>
        <Notice title="Supabase is not configured">
          Set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> and
          restart the dev server. See <code>docs/BACKEND.md</code>.
        </Notice>
      </Shell>
    );
  }

  if (recovering && session) {
    return (
      <Shell>
        <SetPassword onDone={() => setRecovering(false)} />
      </Shell>
    );
  }

  const needsPassword =
    gate === "admin" && session?.user.user_metadata?.needs_password === true;
  if (needsPassword && session) {
    return (
      <Shell>
        <SetPassword
          welcomeName={
            (session.user.user_metadata?.full_name as string | undefined) ??
            null
          }
          onDone={() => {
            supabase!.functions
              .invoke("team", { body: { action: "joined" } })
              .catch(() => undefined);
          }}
        />
      </Shell>
    );
  }

  if (gate === "loading") {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
          Loading…
        </div>
      </Shell>
    );
  }

  if (gate === "signed-out") {
    return (
      <Shell>
        <SignIn />
      </Shell>
    );
  }

  if (gate === "not-admin") {
    return (
      <Shell>
        <Notice title="No admin access">
          You are signed in as <strong>{session?.user.email}</strong>, but this
          account is not on the team. Request access and an owner will review
          it.
        </Notice>
        <div className="mt-4">
          <RequestAccess initialEmail={session?.user.email ?? ""} />
        </div>
        <button
          onClick={() => supabase!.auth.signOut()}
          className="btn-secondary mt-3 w-full py-2.5 text-xs"
        >
          Sign out
        </button>
      </Shell>
    );
  }

  return <Dashboard session={session!} />;
}

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="admin-app flex min-h-screen items-center justify-center px-4 py-10">
    <div className="paper-panel w-full max-w-sm p-6">
      <div className="mb-6 flex items-center gap-3">
        <NimcLogo size="sm" showSubtitle={false} />
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
  const [requesting, setRequesting] = useState(false);
  if (requesting) {
    return (
      <div className="space-y-4">
        <RequestAccess />
        <button
          onClick={() => setRequesting(false)}
          className="w-full text-center text-xs font-semibold text-[#075f3c] hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }
  return <SignInForm onRequest={() => setRequesting(true)} />;
}

function SignInForm({ onRequest }: { onRequest: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"password" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  const signInWithPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("password");
    setError(null);
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setBusy(null);
  };

  const sendLink = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setBusy("link");
    setError(null);
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) setError(error.message);
    else setLinkSent(true);
    setBusy(null);
  };

  const sendReset = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) setError(error.message);
    else setLinkSent(true);
  };

  if (linkSent) {
    return (
      <div className="space-y-3 text-center">
        <Mail className="mx-auto h-8 w-8 text-[#0a7a4b]" />
        <p className="text-sm font-bold text-stone-950">Check your inbox</p>
        <p className="text-xs leading-6 text-stone-600">
          We sent a link to <strong>{email}</strong>. Open it on this device to
          continue.
        </p>
        <button
          onClick={() => setLinkSent(false)}
          className="text-xs font-semibold text-[#075f3c] hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={signInWithPassword} className="space-y-4">
      <label className="block text-xs font-bold text-stone-700">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-control mt-1 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-bold text-stone-700">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-control mt-1 px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <p role="alert" className="text-xs text-[#b4232a]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy !== null}
        className="btn-primary w-full py-2.5 text-xs disabled:opacity-70"
      >
        {busy === "password" ? <Spinner /> : <Lock className="h-3.5 w-3.5" />}
        Sign in
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={sendLink}
          disabled={busy !== null}
          className="font-semibold text-[#075f3c] hover:underline"
        >
          Email me a sign-in link
        </button>
        <button
          type="button"
          onClick={sendReset}
          className="text-stone-500 hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <div className="rounded-xl bg-[#eef0f4] p-3 text-center text-xs text-stone-700">
        New to the team?{" "}
        <button
          type="button"
          onClick={onRequest}
          className="font-bold text-[#075f3c] hover:underline"
        >
          Request access
        </button>
      </div>
    </form>
  );
}

function RequestAccess({ initialEmail = "" }: { initialEmail?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase!.functions.invoke("team", {
      body: { action: "request_access", name, email, note, company: honeypot },
    });
    setBusy(false);
    if (error) {
      const detail = await (error as { context?: Response }).context
        ?.json()
        .catch(() => null);
      setError(detail?.error ?? "Couldn't send your request. Try again.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-2 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-[#0a7a4b]" />
        <p className="text-sm font-bold text-stone-950">Request sent</p>
        <p className="text-xs leading-6 text-stone-600">
          An owner will review it. If you're approved, you'll get an email at{" "}
          <strong>{email}</strong> to choose your password and sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-stone-950">
        <Users className="h-4 w-4 text-[#075f3c]" />
        Request access
      </div>
      <label className="block text-xs font-bold text-stone-700">
        Full name
        <input
          required
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-control mt-1 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-bold text-stone-700">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-control mt-1 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-bold text-stone-700">
        Who are you?{" "}
        <span className="font-normal text-stone-500">
          (helps the owner recognise you)
        </span>
        <input
          maxLength={300}
          placeholder="e.g. Front desk, started Monday"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="field-control mt-1 px-3 py-2 text-sm"
        />
      </label>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {error && (
        <p role="alert" className="text-xs text-[#b4232a]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full py-2.5 text-xs disabled:opacity-70"
      >
        {busy && <Spinner />}
        Send request
      </button>
      <p className="text-center text-[11px] leading-5 text-stone-500">
        You'll never be sent a password. If approved, you choose your own.
      </p>
    </form>
  );
}

function SetPassword({
  onDone,
  welcomeName = null,
}: {
  onDone: () => void;
  welcomeName?: string | null;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase!.auth.updateUser({
      password,
      data: { needs_password: false },
    });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      {welcomeName !== undefined && welcomeName !== null ? (
        <div>
          <p className="text-base font-bold text-stone-950">
            Welcome, {welcomeName.split(" ")[0]}
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-600">
            Choose the password you'll use to sign in. Only you will know it.
          </p>
        </div>
      ) : (
        <p className="text-sm font-bold text-stone-950">
          Choose a new password
        </p>
      )}
      <input
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="field-control px-3 py-2 text-sm"
        placeholder="At least 8 characters"
      />
      {error && <p className="text-xs text-[#b4232a]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full py-2.5 text-xs"
      >
        {busy && <Spinner />}
        {welcomeName ? "Set password and continue" : "Save password"}
      </button>
    </form>
  );
}
