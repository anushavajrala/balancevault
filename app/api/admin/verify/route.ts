import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { auth } from "@/auth";

const prisma = new PrismaClient();
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

type VerifiableTransaction = {
  id: string;
  accountId: string;
  receiverAccountId: string | null;
  amount: number;
  type: "DEPOSIT" | "TRANSFER" | "WITHDRAW";
  previousHash: string | null;
  currentHash: string;
  createdAt: Date;
};

function calculateHash(transaction: VerifiableTransaction): string {
  const previousHash = transaction.previousHash ?? GENESIS_HASH;
  const timestamp = transaction.createdAt.toISOString();
  const payload =
    transaction.type === "TRANSFER"
      ? `${transaction.accountId}-${transaction.receiverAccountId ?? ""}-${transaction.amount}-TRANSFER-${timestamp}-${previousHash}`
      : `${transaction.accountId}-${transaction.amount}-${transaction.type}-${timestamp}-${previousHash}`;

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        accountId: true,
        receiverAccountId: true,
        amount: true,
        type: true,
        previousHash: true,
        currentHash: true,
        createdAt: true,
      },
    });

    const previousByAccount = new Map<string, VerifiableTransaction>();
    for (const transaction of transactions) {
      const previous = previousByAccount.get(transaction.accountId);
      const expectedPreviousHash = previous?.currentHash ?? GENESIS_HASH;
      if (
        transaction.previousHash !== expectedPreviousHash ||
        transaction.currentHash !== calculateHash(transaction)
      ) {
        return NextResponse.json({
          verified: false,
          brokenAt: transaction.id,
          message: "LEDGER COMPROMISED",
        });
      }
      previousByAccount.set(transaction.accountId, transaction);
    }

    return NextResponse.json({ verified: true, message: "LEDGER SECURE" });
  } catch (error) {
    console.error("ADMIN LEDGER VERIFICATION ERROR:", error);
    return NextResponse.json({ error: "Failed to verify ledger" }, { status: 500 });
  }
}
