"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    // Check whether this user has finished onboarding already.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", data.user.id)
      .single();

    router.push(profile?.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="wrap" style={{ paddingTop: 80 }}>
      <h1 style={{ marginBottom: 24 }}>Log in</h1>
      <form onSubmit={handleLogin} className="card">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p style={{ color: "var(--down)", fontSize: "0.85rem", marginTop: 14 }}>{error}</p>
        )}
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: "0.85rem" }}>
        Don't have an account? <a href="/signup" style={{ color: "var(--steel-bright)" }}>Create one</a>
      </p>
    </main>
  );
}
