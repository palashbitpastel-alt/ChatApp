import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        isBanned: false,
        OR: query
          ? [
              { username: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
            ]
          : undefined,
      },
      select: {
        id: true,
        phone: true,
        username: true,
        avatarUrl: true,
        statusMessage: true,
        role: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
