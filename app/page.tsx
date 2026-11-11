import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // 1. Update the account status
    const account = await prisma.account.update({
      where: { id: accountId },
      data: { status: "APPROVED" },
    });

    // 2. Write to the audit log
    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_APPROVED",
        userId: session.user.id,
        details: `Admin approved account ID: ${accountId} for user ID: ${account.userId}`,
      }
    });

    return NextResponse.json({ message: "Account approved successfully", account });
  } catch (error: any) {
    console.error("APPROVE ERROR:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}