"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";

type LedgerAccount = {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
};

type LedgerTransaction = {
  id: string;
  amount: number;
  createdAt: string;
  currentHash: string;
  previousHash: string | null;
  type: string;
  status: string;
};

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationSucceeded, setVerificationSucceeded] = useState<boolean | null>(null);
  const [account, setAccount] = useState<LedgerAccount | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const fetchAccountData = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts/me", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch account ledger");
      }
      setAccount(data.account);
      setTransactions(data.transactions || []);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch account ledger");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status !== "authenticated") return;

    const controller = new AbortController();
    const loadAccountData = async () => {
      try {
        const res = await fetch("/api/accounts/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch account ledger");
        }
        setAccount(data.account);
        setTransactions(data.transactions || []);
        setError("");
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch account ledger");
      } finally {
        if (!controller.signal.aborted) setDataLoading(false);
      }
    };

    void loadAccountData();
    return () => controller.abort();
  }, [status, router]);

  const handleDeposit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDepositLoading(true);
    setError("");
    try {
      const res = await fetch("/api/accounts/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(depositAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deposit failed");
      }
      alert(`Deposit Successful!\nNew Ledger Hash: ${data.hash.substring(0, 20)}...`);
      setDepositAmount("");
      await fetchAccountData();
    } catch (depositError) {
      const message = depositError instanceof Error ? depositError.message : "Deposit failed";
      setError(message);
      alert(message);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleTransfer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTransferLoading(true);
    setError("");
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverEmail,
          amount: Number(transferAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Transfer failed");
      }
      alert(data.message);
      setReceiverEmail("");
      setTransferAmount("");
      await fetchAccountData();
    } catch (transferError) {
      const message = transferError instanceof Error ? transferError.message : "Transfer failed";
      setError(message);
      alert(message);
    } finally {
      setTransferLoading(false);
    }
  };

  const verifyLedger = async () => {
    setVerificationMessage("");
    setVerificationSucceeded(null);
    try {
      const res = await fetch("/api/accounts/verify", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ledger verification failed");
      }
      if (data.verified) {
        setVerificationSucceeded(true);
        setVerificationMessage("Ledger integrity verified.");
      } else {
        setVerificationSucceeded(false);
        setVerificationMessage(`Ledger chain is broken at transaction ${data.brokenAt}.`);
      }
    } catch (verificationError) {
      setVerificationSucceeded(false);
      setVerificationMessage(
        verificationError instanceof Error ? verificationError.message : "Ledger verification failed"
      );
    }
  };

  if (status === "loading" || !session) {
    return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-emerald-500 font-mono">Loading Vault...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-300 p-10 font-sans">
      <header className="mb-10 flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <p className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">Workspace / Accounts</p>
          <h1 className="text-3xl font-light text-white">Ledger Management</h1>
        </div>
        <Link href="/dashboard" className="text-sm bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition">
          Return to Dashboard
        </Link>
      </header>

      {error && <p role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      {!account ? (
        <div className="text-center text-gray-500 mt-20">
          {dataLoading
            ? "Loading account details..."
            : "You do not have an approved account yet. Please request one from the Dashboard."}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:col-span-2 gap-6 h-fit">
            <div className="bg-[#0F1523] border border-gray-800 rounded-xl p-6 h-fit">
              <h2 className="text-lg font-medium text-white mb-4">Deposit Funds</h2>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="100.00"
                  />
                </div>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {depositLoading ? "Processing..." : "Execute Deposit"}
                </button>
              </form>
            </div>

            <div className="bg-[#0F1523] border border-gray-800 rounded-xl p-6 h-fit">
              <h2 className="text-lg font-medium text-white mb-4">Transfer Funds</h2>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="100.00"
                  />
                </div>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {transferLoading ? "Processing..." : "Execute Transfer"}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-[#0F1523] border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-900/50 p-4 border-b border-gray-800">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-white">Immutable Ledger</h2>
                <button
                  type="button"
                  onClick={verifyLedger}
                  className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg px-3 py-2 transition"
                >
                  Verify Ledger Integrity
                </button>
              </div>
            </div>
            {verificationMessage && (
              <p
                role="status"
                className={`mx-4 mt-4 rounded-lg border p-3 text-sm ${
                  verificationSucceeded
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {verificationMessage}
              </p>
            )}
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet.</p>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-4 rounded-lg border ${
                      tx.status === "PENDING"
                        ? "bg-yellow-500/10 border-yellow-500/40"
                        : "bg-gray-800/30 border-gray-700/50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-mono ${tx.status === "PENDING" ? "text-yellow-300" : "text-emerald-400"}`}>
                        {tx.type === "TRANSFER" ? "-" : "+"}${tx.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</span>
                    </div>
                    <p className={`text-xs uppercase tracking-wide mb-2 ${tx.status === "PENDING" ? "text-yellow-300" : "text-gray-500"}`}>
                      {tx.type} · {tx.status}
                    </p>
                    <p className="text-xs text-gray-400 font-mono break-all">Current hash: {tx.currentHash}</p>
                    <p className="text-xs text-gray-600 font-mono break-all mt-1">Previous hash: {tx.previousHash ?? "Genesis block"}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}