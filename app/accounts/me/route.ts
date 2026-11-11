import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, status: "APPROVED" }
    });

    if (!account) return NextResponse.json({ account: null, transactions: [] });

    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ account, transactions });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}