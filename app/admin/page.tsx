"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AdminTransaction = {
  id: string;
  accountId: string;
  amount: number;
  type: string;
  status: string;
  currentHash: string;
  createdAt: string;
};

type AuditLog = {
  id: string;
  createdAt: string;
  action: string;
  userId: string;
  details: string;
};

type PendingAccount = {
  id: string;
  user: { email: string };
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verification, setVerification] = useState<{ verified: boolean; message: string; brokenAt?: string } | null>(null);
  const [corruptingId, setCorruptingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/audit", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setPendingAccounts(data.pendingAccounts || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      const loadAdminData = async () => {
        await fetchData();
      };
      void loadAdminData();
    }
  }, [status, session, router, fetchData]);

  const handleApprove = async (accountId: string) => {
    const res = await fetch("/api/accounts/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (res.ok) {
      fetchData(); // Refresh the lists
    } else {
      alert("Failed to approve account");
    }
  };

  const verifyLedger = async () => {
    setVerificationLoading(true);
    setVerification(null);
    try {
      const response = await fetch("/api/admin/verify", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify ledger");
      }
      setVerification(data);
    } catch (error) {
      setVerification({
        verified: false,
        message: error instanceof Error ? error.message : "Failed to verify ledger",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const simulateTampering = async (transactionId: string) => {
    if (!window.confirm("Change this transaction amount to $999,999 without updating its hash?")) return;

    setCorruptingId(transactionId);
    try {
      const response = await fetch("/api/admin/corrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to simulate tampering");
      }
      await fetchData();
      setVerification(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to simulate tampering");
    } finally {
      setCorruptingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0B0F19] text-emerald-500 flex items-center justify-center font-mono">Initializing Secure Admin Terminal...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-300 p-10 font-sans">
      <header className="mb-10 flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <p className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">Restricted Access</p>
          <h1 className="text-3xl font-light text-white">Admin Command Center</h1>
        </div>
        <Link href="/dashboard" className="text-sm bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition">
          Return to Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-8">

        {/* Ledger Verification Section */}
        <section className="bg-[#0F1523] border border-gray-800 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">Cryptographic Integrity</p>
              <h2 className="text-lg font-medium text-white">Ledger Verification</h2>
              <p className="mt-1 text-sm text-gray-500">Checks transaction hash contents and per-account hash links.</p>
            </div>
            <button
              type="button"
              onClick={verifyLedger}
              disabled={verificationLoading}
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            >
              {verificationLoading ? "Verifying..." : "Verify Ledger Integrity"}
            </button>
          </div>
          {verification && (
            <div
              role="status"
              className={`mt-5 rounded-lg border p-4 text-sm ${
                verification.verified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "animate-pulse border-red-500/40 bg-red-500/15 text-red-300"
              }`}
            >
              <p className="font-semibold">{verification.message}</p>
              {!verification.verified && verification.brokenAt && (
                <p className="mt-1 font-mono text-xs">First invalid transaction: {verification.brokenAt}</p>
              )}
            </div>
          )}
        </section>
        
        {/* Pending Accounts Section */}
        <div className="bg-[#0F1523] border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Pending Account Requests</h2>
            {pendingAccounts.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending requests at the moment.</p>
            ) : (
              <div className="space-y-4">
                {pendingAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium">{acc.user.email}</p>
                      <p className="text-xs text-gray-500 font-mono">Account ID: {acc.id.substring(0, 8)}...</p>
                    </div>
                    <button 
                      onClick={() => handleApprove(acc.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded text-sm font-semibold transition"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Ledger Transactions Section */}
        <div className="bg-[#0F1523] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-gray-900/50 p-4 border-b border-gray-800">
            <h2 className="text-lg font-medium text-white">Ledger Transactions</h2>
            <p className="mt-1 text-xs text-gray-500">Use Tamper to simulate an amount change without updating its hash.</p>
          </div>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No transactions available to test.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900/30 text-gray-400 font-mono text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Transaction</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-800/20">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400" title={transaction.id}>
                        {transaction.id.slice(0, 12)}...
                        <span className="ml-2 text-gray-600">{transaction.type}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-300">${transaction.amount.toFixed(2)}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{transaction.status}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => simulateTampering(transaction.id)}
                          disabled={corruptingId !== null}
                          className="rounded border border-red-500/30 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-50"
                        >
                          {corruptingId === transaction.id ? "Tampering..." : "Tamper"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Audit Log Section */}
        <div className="bg-[#0F1523] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              Immutable Audit Trail
            </h2>
            <span className="text-xs font-mono text-gray-500">Append-Only Mode Active</span>
          </div>
          
          <div className="p-0">
            {logs.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No security events recorded yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900/30 text-gray-400 font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">User ID</th>
                    <th className="px-6 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {log.userId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-gray-400">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}