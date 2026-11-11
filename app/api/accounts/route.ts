import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an account
    const existingAccount = await prisma.account.findFirst({
      where: { userId: session.user.id }
    });

    if (existingAccount) {
      return NextResponse.json({ error: "Account already requested or exists" }, { status: 400 });
    }

    // Create the pending account
    const account = await prisma.account.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
      }
    });

    // Create the immutable audit log
    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_REQUESTED",
        userId: session.user.id,
        details: `User requested a new account. Account ID: ${account.id}`,
      }
    });

    return NextResponse.json({ message: "Account requested successfully", account });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}