import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { checkRateLimit, RateLimitUnavailableError, rateLimitRetryAfter } from "@/app/lib/rate-limit";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const rateLimit = await checkRateLimit(req, "deposit");
    if (!rateLimit.success) {
      const retryAfter = rateLimitRetryAfter(rateLimit.reset);
      return NextResponse.json(
        { error: "Too many deposit requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1. Find the user's APPROVED account
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, status: "APPROVED" }
    });

    if (!account) {
      return NextResponse.json({ error: "No approved account found" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: amount } }
      });

      const lastTransaction = await tx.transaction.findFirst({
        where: { accountId: account.id },
        orderBy: { createdAt: "desc" }
      });
      const previousHash = lastTransaction?.currentHash
        ?? "0000000000000000000000000000000000000000000000000000000000000000";
      const createdAt = new Date(
        Math.max(Date.now(), (lastTransaction?.createdAt.getTime() ?? 0) + 1)
      );
      const currentHash = crypto
        .createHash("sha256")
        .update(`${account.id}-${amount}-DEPOSIT-${createdAt.toISOString()}-${previousHash}`)
        .digest("hex");

      const txRecord = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount,
          type: "DEPOSIT",
          status: "COMPLETED",
          previousHash,
          currentHash,
          performedBy: session.user.id,
          createdAt
        }
      });

      await tx.auditLog.create({
        data: {
          action: "FUNDS_DEPOSITED",
          userId: session.user.id,
          details: `Deposited $${amount}. Hash: ${currentHash.substring(0, 16)}...`
        }
      });

      return { updatedAccount, txRecord };
    });

    return NextResponse.json({ message: "Deposit successful", balance: result.updatedAccount.balance, hash: result.txRecord.currentHash });
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      console.error("DEPOSIT RATE LIMIT UNAVAILABLE:", error.message);
      return NextResponse.json({ error: "Deposits are temporarily unavailable" }, { status: 503 });
    }
    console.error("DEPOSIT ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}