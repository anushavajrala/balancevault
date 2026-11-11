import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { auth } from "@/auth";

const prisma = new PrismaClient();
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

class TransferError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { receiverEmail, amount } = body as {
      receiverEmail?: unknown;
      amount?: unknown;
    };
    if (
      typeof receiverEmail !== "string" ||
      !receiverEmail.trim() ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json({ error: "A valid receiver email and amount are required" }, { status: 400 });
    }

    const senderAccount = await prisma.account.findFirst({
      where: { userId: session.user.id, status: "APPROVED" },
      select: { id: true },
    });
    if (!senderAccount) {
      return NextResponse.json({ error: "No approved account found" }, { status: 403 });
    }

    const receiver = await prisma.user.findUnique({
      where: { email: receiverEmail.trim().toLowerCase() },
      include: { accounts: { where: { status: "APPROVED" }, take: 1 } },
    });
    const receiverAccount = receiver?.accounts[0];
    if (!receiverAccount) {
      return NextResponse.json({ error: "No approved account found for that email" }, { status: 404 });
    }
    if (receiverAccount.id === senderAccount.id) {
      return NextResponse.json({ error: "You cannot transfer funds to your own account" }, { status: 400 });
    }
    const status = amount > 500 ? "PENDING" : "COMPLETED";
    const result = await prisma.$transaction(async (tx) => {
      const accountsToLock =
        status === "COMPLETED"
          ? [senderAccount.id, receiverAccount.id].sort()
          : [senderAccount.id];
      for (const accountId of accountsToLock) {
        const locked = await tx.account.updateMany({
          where: { id: accountId, status: "APPROVED" },
          data: { balance: { increment: 0 } },
        });
        if (locked.count === 0) {
          throw new TransferError(
            accountId === senderAccount.id ? "No approved account found" : "Receiver account is not approved",
            accountId === senderAccount.id ? 403 : 404
          );
        }
      }

      if (status === "COMPLETED") {
        const debit = await tx.account.updateMany({
          where: { id: senderAccount.id, status: "APPROVED", balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (debit.count === 0) {
          throw new TransferError("Insufficient funds", 403);
        }
        await tx.account.update({
          where: { id: receiverAccount.id },
          data: { balance: { increment: amount } },
        });
      } else {
        const hasFunds = await tx.account.updateMany({
          where: { id: senderAccount.id, balance: { gte: amount } },
          data: { balance: { increment: 0 } },
        });
        if (hasFunds.count === 0) {
          throw new TransferError("Insufficient funds", 403);
        }
      }

      const lastTransaction = await tx.transaction.findFirst({
        where: { accountId: senderAccount.id },
        orderBy: { createdAt: "desc" },
      });
      const previousHash = lastTransaction?.currentHash ?? GENESIS_HASH;
      const createdAt = new Date(
        Math.max(Date.now(), (lastTransaction?.createdAt.getTime() ?? 0) + 1)
      );
      const currentHash = crypto
        .createHash("sha256")
        .update(
          `${senderAccount.id}-${receiverAccount.id}-${amount}-TRANSFER-${createdAt.toISOString()}-${previousHash}`
        )
        .digest("hex");

      const transaction = await tx.transaction.create({
        data: {
          accountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          amount,
          type: "TRANSFER",
          status,
          previousHash,
          currentHash,
          performedBy: session.user.id,
          createdAt,
        },
      });

      await tx.auditLog.create({
        data: {
          action: status === "PENDING" ? "LARGE_TRANSFER_FLAGGED" : "FUNDS_TRANSFERRED",
          userId: session.user.id,
          details: `${status === "PENDING" ? "Large transfer flagged" : "Transfer completed"}: $${amount} to ${receiverEmail.trim()}. Transaction ID: ${transaction.id}`,
        },
      });

      return transaction;
    });

    return NextResponse.json({
      message: status === "PENDING" ? "Transfer awaiting admin approval" : "Transfer successful",
      transaction: result,
    });
  } catch (error) {
    if (error instanceof TransferError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("TRANSFER ERROR:", error);
    return NextResponse.json({ error: "Failed to process transfer" }, { status: 500 });
  }
}
