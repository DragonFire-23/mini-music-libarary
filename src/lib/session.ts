import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Reader = { id: string; email: string; name: string } | null;

export function useReader() {
  const [reader, setReader] = useState<Reader>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async (userId: string, email: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      if (!alive) return;
      setReader({
        id: userId,
        email,
        name: data?.display_name?.trim() || email.split("@")[0] || "reader",
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!alive) return;
      if (u) void load(u.id, u.email ?? "");
      else setReader(null);
      setChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const u = session?.user;
      if (u) void load(u.id, u.email ?? "");
      else setReader(null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { reader, checked };
}
