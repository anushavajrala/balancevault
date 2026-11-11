import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/app/lib/prisma";
import { checkRateLimit, RateLimitUnavailableError, rateLimitRetryAfter } from "@/app/lib/rate-limit";
import { registerSchema } from "@/app/lib/validations";

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, "register");
    if (!rateLimit.success) {
      const retryAfter = rateLimitRetryAfter(rateLimit.reset);
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsedBody = registerSchema.safeParse(body);
    if (!parsedBody.success) {
      const issues = parsedBody.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        {
          error: issues[0]?.message ?? "Invalid registration details",
          issues,
        },
        { status: 400 }
      );
    }

    const { name, username, email, phone, password, adminCode } = parsedBody.data;
    const hasAdminCode = adminCode.length > 0;
    let isAdminInviteValid = false;
    if (hasAdminCode) {
      const configuredCode = process.env.ADMIN_INVITE_CODE;
      if (configuredCode) {
        const providedBuffer = Buffer.from(adminCode);
        const configuredBuffer = Buffer.from(configuredCode);
        isAdminInviteValid =
          providedBuffer.length === configuredBuffer.length &&
          timingSafeEqual(providedBuffer, configuredBuffer);
      }
      if (!isAdminInviteValid) {
        return NextResponse.json({ error: "Invalid Admin Invite Code" }, { status: 403 });
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });
    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      return NextResponse.json({ error: `An account with that ${field} already exists` }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: isAdminInviteValid ? "ADMIN" : "USER",
      },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true },
    });

    return NextResponse.json({ message: "User created", user }, { status: 201 });
  }    catch (error: any) {
    console.error("REGISTRATION ERROR:", error);
    // Return the specific error message so we can see it on the screen
    return NextResponse.json({ 
      error: error.message || "Something went wrong",
      code: error.code || "UNKNOWN"
    }, { status: 500 });
  }
}
