import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, status: "APPROVED" },
      select: { id: true },
    });
    if (!account) {
      return NextResponse.json({ error: "No approved account found" }, { status: 403 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, currentHash: true, previousHash: true },
    });

    for (let index = 1; index < transactions.length; index += 1) {
      if (transactions[index].previousHash !== transactions[index - 1].currentHash) {
        return NextResponse.json({ verified: false, brokenAt: transactions[index].id });
      }
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("LEDGER VERIFICATION ERROR:", error);
    return NextResponse.json({ error: "Failed to verify ledger" }, { status: 500 });
  }
}
