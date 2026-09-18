import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        phone: true,
        username: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        isBanned: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            messages: true,
            participants: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { targetUserId, isBanned, role } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Protect admin from accidentally banning or demoting themselves
    if (targetUserId === user.id && (isBanned === true || role === "USER")) {
      return NextResponse.json(
        { error: "You cannot ban or demote your own admin account" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isBanned === "boolean") updateData.isBanned = isBanned;
    if (role === "USER" || role === "ADMIN") updateData.role = role;

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        phone: true,
        username: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
