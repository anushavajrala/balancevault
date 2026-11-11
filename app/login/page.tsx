"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 text-black rounded-lg flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">b</div>
            <span className="font-semibold text-white text-xl tracking-wider">BALANCEVAULT</span>
          </div>

          <h1 className="text-3xl font-light text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-8 text-sm">Enter your credentials to access your secure workspace.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-mono text-gray-400 mb-2 block uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="operator@balancevault.com"
                className="w-full bg-[#0B0F19] border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono text-gray-400 block uppercase tracking-wider">Password</label>
                <Link href="#" className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline">Forgot?</Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0B0F19] border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-3 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] mt-2 uppercase tracking-wider text-sm"
            >
              Initiate Session
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              New operator?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors">
                Request Access
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-[#0F1523] border-l border-gray-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <h2 className="text-2xl font-light text-white mb-4">Cryptographic <span className="font-semibold text-emerald-400">Integrity</span></h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Every transaction is secured with a SHA-256 hash chain. Tamper-proof audit logs ensure that every movement is verified and accountable.
          </p>
        </div>
      </div>
    </div>
  );
}