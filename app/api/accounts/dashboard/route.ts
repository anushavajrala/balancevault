import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
    });
    const approvedAccount = accounts.find((account) => account.status === "APPROVED") ?? null;
    const status = approvedAccount
      ? "ACTIVE"
      : accounts.some((account) => account.status === "PENDING")
        ? "PENDING"
        : "NONE";

    return NextResponse.json({
      totalAccounts: accounts.length,
      approvedAccount,
      status,
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
