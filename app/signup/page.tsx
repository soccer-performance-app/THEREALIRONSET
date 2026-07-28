"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      // Confirmation is off — user is already logged in, go straight to onboarding.
      router.push("/onboarding");
    } else {
      // Confirmation is required — Supabase will handle it via email link/code.
      setError("Check your email to confirm your account, then log in.");
      setLoading(false);
    }
  }

  return (
    <main className="wrap" style={{ paddingTop: 80 }}>
      <h1 style={{ marginBottom: 24 }}>Create account</h1>
      <form onSubmit={handleSignup} className="card">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p style={{ color: "var(--down)", fontSize: "0.85rem", marginTop: 14 }}>{error}</p>
        )}
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: "0.85rem" }}>
        Already have an account? <a href="/login" style={{ color: "var(--steel-bright)" }}>Log in</a>
      </p>
    </main>
  );
}
