import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { DEFAULT_STATUS } from "@/lib/brand";

export async function POST(req: NextRequest) {
  try {
    const { username, phone, password, statusMessage } = await req.json();

    if (!username || !phone || !password) {
      return NextResponse.json(
        { error: "Username, phone number, and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { phone: cleanPhone }],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.username === cleanUsername
              ? "Username is already taken"
              : "Phone number is already registered",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`;

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        phone: cleanPhone,
        passwordHash,
        avatarUrl,
        statusMessage: statusMessage || DEFAULT_STATUS,
        role: "USER",
      },
    });

    const token = signToken({
      userId: user.id,
      phone: user.phone,
      username: user.username,
      role: user.role,
    });

    const userSummary = {
      id: user.id,
      phone: user.phone,
      username: user.username,
      avatarUrl: user.avatarUrl,
      statusMessage: user.statusMessage,
      role: user.role,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };

    const response = NextResponse.json(
      {
        success: true,
        user: userSummary,
        token,
      },
      { status: 201 }
    );

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
