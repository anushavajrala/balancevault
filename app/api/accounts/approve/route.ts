import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // 1. Server-side Role Enforcement (Only ADMIN can approve)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // 2. Update the account status
    const account = await prisma.account.update({
      where: { id: accountId },
      data: { status: "APPROVED" },
    });

    // 3. Write to the immutable Audit Log
    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_APPROVED",
        userId: session.user.id,
        details: `Admin approved account ID: ${accountId} for user ID: ${account.userId}`,
      }
    });

    return NextResponse.json({ message: "Account approved successfully", account });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}