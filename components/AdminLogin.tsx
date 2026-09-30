"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, Sparkles, SunMedium } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const duration = 3800;
    let frame = 0;
    let completionTimer = 0;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const nextProgress = Math.min(100, Math.round(((now - startedAt) / duration) * 100));
      setProgress(nextProgress);
      if (nextProgress < 100) {
        frame = window.requestAnimationFrame(animate);
      } else {
        completionTimer = window.setTimeout(() => setIntroComplete(true), 320);
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(completionTimer);
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });
      if (!response.ok) throw new Error("Invalid username or password.");
      setSuccess(true);
      const next = new URLSearchParams(window.location.search).get("next") || "/admin";
      const destination = new URL(next, window.location.origin);
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      window.location.assign(destination.origin === window.location.origin ? `${destination.pathname}${destination.search}${destination.hash}` : "/admin");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
      setLoading(false);
    }
  };

  return (
    <main className={`auth-experience ${introComplete ? "is-ready" : "is-intro"}`}>
      {!introComplete && (
        <section className="auth-intro" aria-label="GBP Home Art and Decors loading" aria-live="polite">
          <div className="intro-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          <img className="intro-logo" src="/gbp-logo.png" alt="GBP Home Art & Decors" />
          <span className="intro-brand">GBP HOME ART &amp; DECORS</span>
          <h1>Elegance in Every Space</h1>
          <div className="intro-progress" role="progressbar" aria-label="Loading the GBP sign-in experience" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="intro-percent">{progress}%</span>
          <span className="intro-loading"><span />Preparing your private workspace</span>
        </section>
      )}

      <section className={`auth-login ${introComplete ? "is-visible" : ""}`} aria-hidden={!introComplete}>
        <aside className="auth-visual" aria-label="Warm, refined home interior">
          <img src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1800&q=85" alt="Warm modern living room with considered home decor" />
          <div className="auth-visual-shade" />
          <div className="auth-visual-top"><span>EST. WITH CARE</span><span>PHILIPPINES</span></div>
          <div className="auth-visual-copy">
            <span className="auth-overline"><SunMedium size={15} /> ELEGANCE IN EVERY SPACE</span>
            <p className="auth-quote">Thoughtful details.<br /><em>Beautifully at home.</em></p>
            <span className="auth-visual-rule" />
            <span className="auth-visual-caption">GBP HOME ART &amp; DECORS · PRIVATE OPERATIONS</span>
          </div>
        </aside>

        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <a className="auth-brand" href="/" aria-label="GBP Home Art & Decors home">
              <img src="/gbp-logo.png" alt="" />
              <span><strong>GBP</strong><small>HOME ART &amp; DECORS</small></span>
            </a>

            <div className="auth-heading">
              <span className="auth-overline">PRIVATE STUDIO ACCESS</span>
              <h1>Welcome <em>Back</em></h1>
              <p>Sign in to continue to your operations workspace.</p>
            </div>

            <form onSubmit={submit} className="auth-form">
              <label className="auth-field" htmlFor="admin-username">
                <span>Admin username</span>
                <input id="admin-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your admin username" required />
              </label>

              <label className="auth-field" htmlFor="admin-password">
                <span>Password</span>
                <span className="auth-password-wrap">
                  <input id="admin-password" name="password" autoComplete="current-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
                  <button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <div className="auth-options">
                <label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span className="remember-check"><Check size={12} /></span><span>Remember me</span></label>
                <a href="mailto:gbphomedecors@mail.com?subject=Admin%20password%20reset">Forgot password?</a>
              </div>

              {error && <div className="auth-message error" role="alert"><ShieldCheck size={17} />{error}</div>}
              {success && <div className="auth-message success" role="status"><Check size={17} />Signed in. Opening your workspace…</div>}

              <button className="auth-submit" type="submit" disabled={loading || success}>
                <span>{loading ? "Verifying access..." : success ? "Welcome back" : "Sign in securely"}</span>
                {success ? <Check size={18} /> : loading ? <span className="auth-spinner" /> : <ArrowRight size={18} />}
              </button>
            </form>

            <div className="auth-security"><LockKeyhole size={15} /><span>Protected admin access</span><span className="security-divider" /><KeyRound size={14} /><span>Encrypted session</span></div>
            <p className="auth-footer">© {new Date().getFullYear()} GBP Home Art &amp; Decors</p>
          </div>
        </section>
      </section>
    </main>
  );
}
