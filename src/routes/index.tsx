import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Little Music Library" },
      {
        name: "description",
        content: "A cozy room where your music collection lives on wooden shelves.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void navigate({ to: "/library", replace: true });
      } else {
        void navigate({ to: "/auth", replace: true });
      }
    });
  }, [navigate]);

  return null;
}
