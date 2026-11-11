"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DashboardData = {
  totalAccounts: number;
  approvedAccount: { id: string } | null;
  status: "ACTIVE" | "PENDING" | "NONE";
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/accounts/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch dashboard");
        }
        setDashboard(data);
        setDashboardError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setDashboardError(error instanceof Error ? error.message : "Failed to fetch dashboard");
      }
    };

    void fetchDashboard();
    return () => controller.abort();
  }, [status]);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-emerald-500 font-mono">Loading Vault...</div>;
  }

  const handleRequestAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("Account request submitted successfully! Awaiting admin approval.");
        setDashboard(null);
        setDashboardError("");
        const refresh = await fetch("/api/accounts/dashboard", { cache: "no-store" });
        const refreshedData = await refresh.json();
        if (!refresh.ok) throw new Error(refreshedData.error || "Failed to refresh dashboard");
        setDashboard(refreshedData);
      } else {
        alert(data.error || "Failed to request account");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request account";
      alert(message);
      setDashboardError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-300 flex font-sans selection:bg-emerald-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F1523] border-r border-gray-800 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-emerald-500 text-black rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">b</div>
            <span className="font-semibold text-white text-lg tracking-wider">BALANCEVAULT</span>
          </div>
          
          <nav className="space-y-2">
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Overview
            </div>
            
            {/* NEW ACCOUNTS LINK */}
            <a href="/accounts" className="px-4 py-2.5 text-gray-500 text-sm hover:text-gray-300 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors block">
              Accounts
            </a>
            
            <a href="/admin" className="px-4 py-2.5 text-gray-500 text-sm hover:text-gray-300 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors block">
              Audit Log
            </a>
          </nav>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white">{session?.user?.email?.split("@")[0]}</p>
              <p className="text-xs text-emerald-500 font-mono mt-1 border border-emerald-500/30 inline-block px-2 py-0.5 rounded bg-emerald-500/10">
                {session?.user?.role}
              </p>
            </div>
          </div>
          <button onClick={() => {
  // Clear the cookie manually and hard reload the page
  document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = "/login";
}} className="w-full text-sm bg-red-500/10 text-red-400 border border-red-500/20 py-2 rounded-lg hover:bg-red-500/20 transition-all">
  Terminate Session
</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <p className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">Workspace / Overview</p>
            <h1 className="text-3xl font-light text-white">Good to see you, <span className="font-semibold text-emerald-400">{session?.user?.email?.split("@")[0]}</span></h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0F1523] border border-gray-800 p-6 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Total Accounts</p>
            <h2 className="text-4xl font-light text-white font-mono">
              {dashboard ? String(dashboard.totalAccounts).padStart(2, "0") : "--"}
            </h2>
          </div>
          <div className="bg-[#0F1523] border border-gray-800 p-6 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Account Status</p>
            <h2 className="text-xl font-medium text-white mt-2">
              {dashboard?.status === "ACTIVE"
                ? "Active"
                : dashboard?.status === "PENDING"
                  ? "Pending Approval"
                  : dashboard?.status === "NONE"
                    ? "No Accounts"
                    : "Loading..."}
            </h2>
          </div>
          <div className="bg-[#0F1523] border border-emerald-900/50 p-6 rounded-xl">
            <p className="text-sm text-emerald-400 mb-1 flex items-center gap-2">Ledger Integrity <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span></p>
            <h2 className="text-xl font-medium text-white mt-2 font-mono">VERIFIED</h2>
          </div>
        </div>

        <div className="bg-[#0F1523] border border-gray-800 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          {dashboardError ? (
            <p className="text-sm text-red-400">{dashboardError}</p>
          ) : dashboard?.status === "ACTIVE" ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-8 py-6">
              <h3 className="text-xl font-medium text-emerald-400 mb-2">Account Active</h3>
              <p className="text-sm text-gray-400 mb-5">Your ledger is ready to use.</p>
              <a href="/accounts" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 px-6 rounded-lg transition-all">
                Open Ledger
              </a>
            </div>
          ) : dashboard?.status === "PENDING" ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-8 py-6">
              <h3 className="text-xl font-medium text-yellow-400 mb-2">Approval Pending</h3>
              <p className="text-sm text-gray-400">An administrator must approve your account before your ledger can be initialized.</p>
            </div>
          ) : dashboard?.status === "NONE" ? (
            <>
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Accounts Provisioned</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">Customer accounts are strictly gated. An administrator must review and approve your KYC request before a ledger can be initialized.</p>
              <button
                onClick={handleRequestAccount}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {loading ? "Processing..." : "Request Account Access"}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading account details...</p>
          )}
        </div>
      </main>
    </div>
  );
}