"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) throw new Error("Invalid username or password.");
      const next = new URLSearchParams(window.location.search).get("next") || "/admin";
      window.location.assign(next.startsWith("/admin") ? next : "/admin");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
      setLoading(false);
    }
  };

  return <main className="loginShell"><div className="loginGlow glowOne"/><div className="loginGlow glowTwo"/><section className="loginPanel"><div className="loginBrand"><span className="logoMark">GBP</span><span>GBP HOME ART & DECORS</span></div><div className="loginEyebrow"><Sparkles size={14}/> Private studio access</div><h1 className="serif">Enter the<br/><em>control room.</em></h1><p className="loginIntro">A quiet command center for orders, inventory, and every detail behind the GBP experience.</p><form onSubmit={submit} className="loginForm"><label>Admin username<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="name@company.com" required/></label><label>Secure password<input autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required/></label>{error && <div className="loginError"><ShieldCheck size={15}/>{error}</div>}<button className="loginSubmit" disabled={loading}>{loading ? "Verifying access..." : "Open admin studio"}<ArrowRight size={17}/></button></form><div className="loginSecurity"><LockKeyhole size={15}/><span>Encrypted session · Admins only</span></div></section><aside className="loginAside"><div className="loginAsideTop"><span>GBP / 01</span><span>Private operations</span></div><div className="loginAsideContent"><div className="orbit orbitA"/><div className="orbit orbitB"/><div className="loginObject"><div className="objectCore"/><div className="objectRing"/></div><span className="kicker">Studio intelligence</span><h2 className="serif">Shape the flow<br/>of every order.</h2><p>Designed for calm decisions, precise movement, and a more considered customer journey.</p></div><div className="loginAsideBottom"><span>Orders / Inventory / Fulfillment</span><span>2026</span></div></aside></main>;
}
