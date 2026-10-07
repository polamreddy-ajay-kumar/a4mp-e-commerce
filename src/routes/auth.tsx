import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or Sign up — A4MP" },
      { name: "description", content: "Login to A4MP to access your cart, orders and offers." },
      { property: "og:title", content: "Login — A4MP" },
      { property: "og:description", content: "Login to A4MP to access your cart and orders." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="mx-auto my-10 grid max-w-3xl overflow-hidden rounded-2xl bg-card shadow-lift md:grid-cols-[2fr_3fr]">
      <div className="bg-brand-gradient flex flex-col justify-between gap-6 p-8 text-primary-foreground">
        <div>
          <h1 className="text-3xl font-extrabold">{mode === "in" ? "Login" : "Looks like you're new here!"}</h1>
          <p className="mt-3 opacity-85">Get access to your Orders, Cart and exclusive offers.</p>
        </div>
        <span className="font-display text-4xl font-extrabold text-accent">A4MP</span>
      </div>
      <form onSubmit={submit} className="space-y-4 p-8">
        <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b bg-transparent py-2.5 text-sm outline-none focus:border-primary" />
        <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b bg-transparent py-2.5 text-sm outline-none focus:border-primary" />
        <button disabled={busy} className="w-full rounded-lg bg-cta py-3 font-bold text-cta-foreground disabled:opacity-60">{busy ? "Please wait…" : mode === "in" ? "Login" : "Create account"}</button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
        <button type="button" onClick={google} className="w-full rounded-lg border py-3 text-sm font-semibold hover:bg-muted">Continue with Google</button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full pt-2 text-sm font-semibold text-primary">
          {mode === "in" ? "New to A4MP? Create an account" : "Existing user? Log in"}
        </button>
      </form>
    </div>
  );
}
