import { auth } from "@/auth";
import { GET } from "../api/audit/route";
import { GET as verifyLedger } from "../api/admin/verify/route";
import crypto from "crypto";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    auditLog: { findMany: jest.fn() },
    account: { findMany: jest.fn() },
    transaction: { findMany: jest.fn() },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

const mockPrisma = jest.requireMock("@prisma/client").__mockPrisma as {
  auditLog: { findMany: jest.Mock };
  account: { findMany: jest.Mock };
  transaction: { findMany: jest.Mock };
};

describe("GET /api/audit role-based access control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.account.findMany.mockResolvedValue([]);
    mockPrisma.transaction.findMany.mockResolvedValue([]);
  });

  it("rejects a user without the ADMIN role", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "user-1",
        role: "USER",
        email: "user@example.com",
      },
      expires: new Date().toISOString(),
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized: Admin access required",
    });
    expect(mockPrisma.auditLog.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.account.findMany).not.toHaveBeenCalled();
  });

  it("allows a user with the ADMIN role", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        email: "admin@example.com",
      },
      expires: new Date().toISOString(),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      logs: [],
      pendingAccounts: [],
      transactions: [],
    });
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.account.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledTimes(1);
  });

  it("detects an amount changed without updating its transaction hash", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        email: "admin@example.com",
      },
      expires: new Date().toISOString(),
    });

    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const previousHash = "0".repeat(64);
    const originalAmount = 25;
    const originalHash = crypto
      .createHash("sha256")
      .update(`account-1-${originalAmount}-DEPOSIT-${createdAt.toISOString()}-${previousHash}`)
      .digest("hex");
    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        id: "transaction-1",
        accountId: "account-1",
        receiverAccountId: null,
        amount: 999999,
        type: "DEPOSIT",
        previousHash,
        currentHash: originalHash,
        createdAt,
      },
    ]);

    const response = await verifyLedger();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      verified: false,
      brokenAt: "transaction-1",
      message: "LEDGER COMPROMISED",
    });
  });
});
