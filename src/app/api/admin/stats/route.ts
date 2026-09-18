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

    const [totalUsers, onlineUsers, totalMessages, totalChats, totalGroups, totalBroadcasts] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isOnline: true } }),
        prisma.message.count(),
        prisma.chat.count(),
        prisma.chat.count({ where: { isGroup: true } }),
        prisma.systemBroadcast.count(),
      ]);

    const activeSockets = onlineUsers; // Proxy from active online users

    return NextResponse.json({
      stats: {
        totalUsers,
        onlineUsers,
        totalMessages,
        totalChats,
        totalGroups,
        totalBroadcasts,
        activeSockets,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
