import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }
    if (
      !body ||
      typeof body !== "object" ||
      typeof (body as { transactionId?: unknown }).transactionId !== "string" ||
      !(body as { transactionId: string }).transactionId.trim()
    ) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const { transactionId } = body as { transactionId: string };
    const transaction = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id: transactionId },
        select: { id: true, amount: true, currentHash: true },
      });
      if (!existing) return null;

      const corrupted = await tx.transaction.update({
        where: { id: transactionId },
        data: { amount: 999999 },
        select: { id: true, amount: true, currentHash: true },
      });
      await tx.auditLog.create({
        data: {
          action: "LEDGER_TAMPER_SIMULATED",
          userId: session.user.id,
          details: `Tamper simulation changed transaction ${existing.id} amount from ${existing.amount} to 999999 without changing its hash.`,
        },
      });
      return corrupted;
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Transaction amount corrupted; its hash was not changed.",
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("LEDGER TAMPER SIMULATION ERROR:", error);
    return NextResponse.json({ error: "Failed to simulate ledger tampering" }, { status: 500 });
  }
}
