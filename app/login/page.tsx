"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error || !result?.ok) {
        setError("Invalid email or password");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F19] text-gray-200">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[540px] w-[540px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-8rem] h-[520px] w-[520px] rounded-full bg-teal-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-12">
        <section className="max-w-2xl">
          <Link href="/login" className="mb-14 inline-flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inset-0 rounded-2xl bg-emerald-400/40 blur-xl animate-pulse" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-3xl font-bold text-black shadow-[0_0_32px_rgba(16,185,129,0.28)]">
                b
              </span>
            </span>
            <span className="text-sm font-semibold tracking-[0.24em] text-white">BALANCEVAULT</span>
          </Link>

          <p className="mb-5 font-mono text-xs uppercase tracking-[0.3em] text-emerald-400">
            Financial clarity, by design
          </p>
          <h1 className="text-5xl font-light leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            BalanceVault: Money movement with a ledger you can prove.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
            Move with confidence. Every transaction is recorded in a transparent,
            verifiable ledger built for accountability.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <div className="rounded-full border border-gray-800 bg-[#0F1523]/70 px-4 py-2 text-xs text-gray-300">
              <span className="mr-2 text-emerald-400">●</span> SHA-256 chain
            </div>
            <div className="rounded-full border border-gray-800 bg-[#0F1523]/70 px-4 py-2 text-xs text-gray-300">
              <span className="mr-2 text-emerald-400">●</span> Auditable activity
            </div>
            <div className="rounded-full border border-gray-800 bg-[#0F1523]/70 px-4 py-2 text-xs text-gray-300">
              <span className="mr-2 text-emerald-400">●</span> Secure access
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-[#0F1523]/75 p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">
            <div className="mb-8">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">
                Secure access
              </p>
              <h2 className="text-2xl font-medium text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-400">Sign in to your BalanceVault account.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-medium text-gray-300">
                  Email address
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
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-medium text-gray-300">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-emerald-400 transition hover:text-emerald-300">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0B0F19]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to BalanceVault"}
              </button>
            </form>

            <div className="mt-7 border-t border-gray-800 pt-6 text-center">
              <p className="text-sm text-gray-400">
                New to BalanceVault?{" "}
                <Link href="/register" className="font-medium text-emerald-400 transition hover:text-emerald-300">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-gray-600">
            Protected access · Verifiable transactions
          </p>
        </section>
      </div>
    </main>
  );
}
