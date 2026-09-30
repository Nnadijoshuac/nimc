import React, { createContext, useContext, useMemo } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AdminUser } from "./types";

interface AdminContextValue {
  db: SupabaseClient;
  session: Session;
  admins: AdminUser[];
  me: AdminUser | undefined;
  /** Name used to sign WhatsApp / text messages, e.g. "Uncle Joshua". */
  myName: string;
  adminName: (userId: string | null | undefined) => string | null;
  toast: (message: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export const AdminProvider: React.FC<{
  session: Session;
  admins: AdminUser[];
  toast: (message: string) => void;
  children: React.ReactNode;
}> = ({ session, admins, toast, children }) => {
  const value = useMemo<AdminContextValue>(() => {
    const me = admins.find((a) => a.user_id === session.user.id);
    const byId = new Map(
      admins.map((a) => [a.user_id, a.full_name || a.email]),
    );
    return {
      db: supabase!,
      session,
      admins,
      me,
      myName:
        me?.full_name?.trim() ||
        session.user.email?.split("@")[0] ||
        "the team",
      adminName: (id) => (id ? (byId.get(id) ?? null) : null),
      toast,
    };
  }, [session, admins, toast]);

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
};
