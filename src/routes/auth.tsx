import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Library Card — The Little Music Library" },
      {
        name: "description",
        content:
          "Sign in or make a library card so your shelved songs, notes and uploaded music are remembered on every visit.",
      },
      { property: "og:title", content: "Library Card — The Little Music Library" },
      {
        property: "og:description",
        content: "Make a library card and keep your songs attached to your own account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/library", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        const { error: inErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (inErr) {
          setNote("Card made. Check your email to confirm, then come back and sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      void navigate({ to: "/library", replace: true });
    } catch (err) {
      setNote(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-6 py-12"
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 62% 18%, oklch(0.26 0.035 58) 0%, oklch(0.17 0.024 52) 46%, oklch(0.11 0.016 48) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 vignette" />

      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-[3px] wood-surface p-8"
        style={{ boxShadow: "var(--shadow-object)" }}
      >
        <p className="plate-type text-[10px] uppercase tracking-[0.35em] text-parchment-dim/55">
          the front desk
        </p>
        <h1 className="hand -mt-0.5 text-4xl text-parchment">
          {mode === "in" ? "Sign in" : "Make a library card"}
        </h1>
        <p className="hand mt-1 text-base text-parchment-dim/65">
          Your shelved songs stay attached to your card.
        </p>

        {mode === "up" && (
          <label className="mt-6 block">
            <span className="hand text-base text-parchment-dim/70">name on the card</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="what should the room call you?"
              className="hand mt-1 w-full rounded-[3px] border border-parchment-dim/25 bg-ink/40 px-3 py-2 text-lg text-parchment outline-none focus:border-parchment-dim/60"
            />
          </label>
        )}

        <label className="mt-4 block">
          <span className="hand text-base text-parchment-dim/70">email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hand mt-1 w-full rounded-[3px] border border-parchment-dim/25 bg-ink/40 px-3 py-2 text-lg text-parchment outline-none focus:border-parchment-dim/60"
          />
        </label>

        <label className="mt-4 block">
          <span className="hand text-base text-parchment-dim/70">password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hand mt-1 w-full rounded-[3px] border border-parchment-dim/25 bg-ink/40 px-3 py-2 text-lg text-parchment outline-none focus:border-parchment-dim/60"
          />
        </label>

        {note && <p className="hand mt-4 text-base text-parchment/85">{note}</p>}

        <button
          type="submit"
          disabled={busy}
          className="hand mt-6 w-full cursor-pointer rounded-[3px] border border-parchment-dim/30 bg-ink/50 px-4 py-2.5 text-xl text-parchment transition-colors hover:bg-ink/70 disabled:opacity-50"
        >
          {busy ? "one moment…" : mode === "in" ? "open the door" : "make my card"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setNote(null);
          }}
          className="hand mt-4 w-full cursor-pointer text-base text-parchment-dim/60 hover:text-parchment"
        >
          {mode === "in" ? "no card yet? make one" : "already have a card? sign in"}
        </button>

        <Link
          to="/library"
          className="hand mt-4 block text-center text-sm text-parchment-dim/45 hover:text-parchment-dim"
        >
          ← back to the room
        </Link>
      </form>
    </main>
  );
}
