import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasRole, setHasRole] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let initialResolved = false;

    const checkRole = async (userId: string) => {
      const [{ data: roleData, error: roleError }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase
          .from("profiles")
          .select("approval_status")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      if (!isMounted) return;
      setHasRole(!roleError && !!roleData);
      setIsAdmin(!roleError && roleData?.role === "admin");
      setApprovalStatus(
        ((profileData as any)?.approval_status as
          | "pending"
          | "approved"
          | "rejected"
          | undefined) ?? null,
      );
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // Defer Supabase calls out of the auth callback to avoid deadlocks
        // (Supabase docs: never await DB queries inside onAuthStateChange).
        setTimeout(() => {
          if (isMounted) void checkRole(nextSession.user.id);
        }, 0);
      } else if (initialResolved) {
        // Only clear role state once the initial session lookup has resolved,
        // otherwise transient null events on boot would flip loading=false
        // before the persisted session is restored.
        setIsAdmin(false);
        setHasRole(false);
        setApprovalStatus(null);
        setLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      initialResolved = true;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void checkRole(currentSession.user.id);
      } else {
        setIsAdmin(false);
        setHasRole(false);
        setApprovalStatus(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName || "" },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, isAdmin, hasRole, approvalStatus, loading, signIn, signUp, signOut };
}
