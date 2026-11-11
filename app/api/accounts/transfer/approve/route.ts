import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

class ApprovalError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || typeof (body as { transactionId?: unknown }).transactionId !== "string") {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }
    const { transactionId } = body as { transactionId: string };

    const transaction = await prisma.$transaction(async (tx) => {
      const pendingTransfer = await tx.transaction.findFirst({
        where: { id: transactionId, type: "TRANSFER", status: "PENDING" },
        include: { account: true, receiverAccount: true },
      });
      if (!pendingTransfer) {
        throw new ApprovalError("Pending transfer not found", 404);
      }
      if (
        pendingTransfer.account.status !== "APPROVED" ||
        !pendingTransfer.receiverAccount ||
        pendingTransfer.receiverAccount.status !== "APPROVED"
      ) {
        throw new ApprovalError("Transfer accounts must be approved", 403);
      }

      const claimed = await tx.transaction.updateMany({
        where: { id: pendingTransfer.id, status: "PENDING" },
        data: { status: "COMPLETED" },
      });
      if (claimed.count === 0) {
        throw new ApprovalError("Transfer has already been processed", 409);
      }

      for (const accountId of [pendingTransfer.accountId, pendingTransfer.receiverAccount.id].sort()) {
        const locked = await tx.account.updateMany({
          where: { id: accountId, status: "APPROVED" },
          data: { balance: { increment: 0 } },
        });
        if (locked.count === 0) {
          throw new ApprovalError("Transfer accounts must be approved", 403);
        }
      }

      const debit = await tx.account.updateMany({
        where: {
          id: pendingTransfer.accountId,
          status: "APPROVED",
          balance: { gte: pendingTransfer.amount },
        },
        data: { balance: { decrement: pendingTransfer.amount } },
      });
      if (debit.count === 0) {
        throw new ApprovalError("Insufficient funds to approve transfer", 403);
      }

      await tx.account.update({
        where: { id: pendingTransfer.receiverAccount.id },
        data: { balance: { increment: pendingTransfer.amount } },
      });

      await tx.auditLog.create({
        data: {
          action: "TRANSFER_APPROVED",
          userId: session.user.id,
          details: `Admin approved transfer transaction ID: ${pendingTransfer.id}`,
        },
      });

      return tx.transaction.findUniqueOrThrow({ where: { id: pendingTransfer.id } });
    });

    return NextResponse.json({ message: "Transfer approved successfully", transaction });
  } catch (error) {
    if (error instanceof ApprovalError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("TRANSFER APPROVAL ERROR:", error);
    return NextResponse.json({ error: "Failed to approve transfer" }, { status: 500 });
  }
}
