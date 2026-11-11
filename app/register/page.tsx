"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const strength = password.length === 0 ? 0 : Math.min(100, Math.round((password.length / 12) * 100));
  const strengthColor =
    password.length < 8 ? "bg-red-500" : password.length < 12 ? "bg-yellow-400" : "bg-emerald-500";
  const strengthLabel =
    password.length === 0 ? "Enter a password" : password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong";

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, phone, password, adminCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create your account");
        return;
      }

      router.push("/login");
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F19] px-5 py-10 text-gray-200 sm:px-8">
      <div className="pointer-events-none absolute -right-36 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 left-[-8rem] h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute inset-0 rounded-xl bg-emerald-400/30 blur-lg animate-pulse" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-2xl font-bold text-black">
                b
              </span>
            </span>
            <span className="text-xs font-semibold tracking-[0.2em] text-white">BALANCEVAULT</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-400 transition hover:text-emerald-400">
            Sign in
          </Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-[#0F1523]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-10">
          <div className="mb-8">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">
              Account setup · 01
            </p>
            <h1 className="text-3xl font-light tracking-tight text-white sm:text-4xl">Create your account</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
              Set up your secure profile to get started with clear, verifiable money movement.
            </p>
          </div>

          {error && error !== "Passwords do not match." && (
            <div role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-xs font-medium text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-gray-700/80 bg-[#0B0F19]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label htmlFor="username" className="mb-2 block text-xs font-medium text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={50}
                pattern="[A-Za-z0-9_]+"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
                className="w-full rounded-xl border border-gray-700/80 bg-[#0B0F19]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-1.5 text-[11px] text-gray-600">Letters, numbers, and underscores.</p>
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-700/80 bg-[#0B0F19]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-xs font-medium text-gray-300">
                Phone Number <span className="text-gray-600">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="5551234567"
                className="w-full rounded-xl border border-gray-700/80 bg-[#0B0F19]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-1.5 text-[11px] text-gray-600">Optional. If provided, enter exactly 10 digits.</p>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-gray-300">
                  Password
                </label>
                <span className={`text-[11px] ${password.length >= 12 ? "text-emerald-400" : password.length >= 8 ? "text-yellow-300" : "text-gray-500"}`}>
                  {strengthLabel}
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error === "Passwords do not match.") setError("");
                  }}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-gray-700/50 bg-[#0B0F19]/80 px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500 transition hover:text-emerald-400"
                >
                  {showPassword ? (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3M6.2 6.2C3.9 7.7 2.7 9.7 2.5 12c.5 1.2 1.5 2.7 3 4a10 10 0 006.5 3c1.2 0 2.3-.2 3.3-.7" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800"
                role="meter"
                aria-label="Password strength"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={strength}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${strength}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-600">Use at least 8 characters for a secure password.</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="confirmPassword" className="mb-2 block text-xs font-medium text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (error === "Passwords do not match.") setError("");
                  }}
                  placeholder="Re-enter your password"
                  aria-invalid={Boolean(error && password !== confirmPassword)}
                  aria-describedby={error && password !== confirmPassword ? "password-error" : undefined}
                  className="w-full rounded-xl border border-gray-700/50 bg-[#0B0F19]/80 px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                  aria-pressed={showConfirmPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500 transition hover:text-emerald-400"
                >
                  {showConfirmPassword ? (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3M6.2 6.2C3.9 7.7 2.7 9.7 2.5 12c.5 1.2 1.5 2.7 3 4a10 10 0 006.5 3c1.2 0 2.3-.2 3.3-.7" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
              {error === "Passwords do not match." && (
                <p id="password-error" role="alert" className="mt-2 text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="adminCode" className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-300">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M7 10V7a5 5 0 0110 0v3m-11 0h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2zm5 4v3"
                  />
                </svg>
                Admin Invite Code (Optional)
              </label>
              <input
                id="adminCode"
                type="password"
                autoComplete="off"
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value)}
                placeholder="Restricted access"
                className="w-full rounded-xl border border-gray-800 bg-[#080B12] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10"
              />
              <p className="mt-1.5 text-[11px] text-gray-600">
                Leave blank for a standard account.
              </p>
            </div>

            <div className="mt-2 sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create secure account"}
              </button>
              <p className="mt-5 text-center text-xs text-gray-600">
                By continuing, your account details will be stored securely.
              </p>
            </div>
          </form>
        </section>

        <p className="mt-6 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 transition hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
