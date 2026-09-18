import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Phone/username and password are required" },
        { status: 400 }
      );
    }

    // Find user by username or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier.trim() }, { phone: identifier.trim() }],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "Your account has been suspended by an administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
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

    const response = NextResponse.json({
      success: true,
      user: userSummary,
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
