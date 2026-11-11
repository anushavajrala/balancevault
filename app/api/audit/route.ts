import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    // Fetch Audit Logs
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Fetch Pending Accounts (Include user email so Admin knows who it is)
    const pendingAccounts = await prisma.account.findMany({
      where: { status: "PENDING" },
      include: { user: true } 
    });

    const transactions = await prisma.transaction.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
      select: {
        id: true,
        accountId: true,
        amount: true,
        type: true,
        status: true,
        currentHash: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ logs, pendingAccounts, transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}