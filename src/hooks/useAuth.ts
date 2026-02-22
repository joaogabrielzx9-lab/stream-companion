import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check admin role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .eq("role", "admin")
            .maybeSingle();
          setIsAdmin(!!roleData);

          // Check subscription
          const { data: profile } = await supabase
            .from("profiles")
            .select("expires_at")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          
          const active = !profile?.expires_at || new Date(profile.expires_at) > new Date();
          setIsActive(active || !!roleData);
        } else {
          setIsAdmin(false);
          setIsActive(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, isActive, loading, signIn, signOut };
}
