"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearStoredToken, getStoredToken, setStoredToken } from "@/services/apiClient";
import { getCurrentAdminAccess, PORTAL_ROLES } from "@/services/rbacService";
import { login } from "@/services/superAdminService";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyExistingSession() {
      const token = getStoredToken();
      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const access = await getCurrentAdminAccess();
        if (PORTAL_ROLES.includes(access.role as (typeof PORTAL_ROLES)[number])) {
          router.replace(access.role === "OPERATIONS_ADMIN" ? "/operations" : access.role === "FINANCE_ADMIN" ? "/finance" : access.role === "SUPPORT_ADMIN" ? "/support" : access.role === "PLUMBER_MANAGER" ? "/plumber-manager" : access.role === "MARKETING_ADMIN" ? "/marketing" : "/dashboard");
          return;
        }
        clearStoredToken();
      } catch {
        clearStoredToken();
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void verifyExistingSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email.trim(), password);
      if (!PORTAL_ROLES.includes(response.role as (typeof PORTAL_ROLES)[number])) {
        clearStoredToken();
        setError("Only admin roles can use this portal.");
        return;
      }

      setStoredToken(response.token);
      router.replace(response.role === "OPERATIONS_ADMIN" ? "/operations" : response.role === "FINANCE_ADMIN" ? "/finance" : response.role === "SUPPORT_ADMIN" ? "/support" : response.role === "PLUMBER_MANAGER" ? "/plumber-manager" : response.role === "MARKETING_ADMIN" ? "/marketing" : "/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="loading-state">
        <div className="loading-card">
          <div className="loading-bar" />
          <div className="loading-copy">Checking portal access</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-brand">
          <div className="admin-mark">P</div>
          <div>
            <h1 className="login-title">PlumbCommerce</h1>
            <p className="login-subtitle">Admin Portal</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input id="email" className="field-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@plumbcommerce.com" required />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <input id="password" className="field-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
          </div>

          {error ? <div className="field-error">{error}</div> : null}

          <button type="submit" className="button button-primary button-block" disabled={loading}>
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
