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

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, status: "APPROVED" },
      include: {
        ledger: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ account: null, transactions: [] });
    }

    const { ledger, ...accountDetails } = account;
    return NextResponse.json({ account: accountDetails, transactions: ledger });
  } catch (error) {
    console.error("ACCOUNT LEDGER ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch account ledger" }, { status: 500 });
  }
}
