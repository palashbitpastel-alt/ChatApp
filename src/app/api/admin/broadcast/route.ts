import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Server as SocketIOServer } from "socket.io";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const broadcasts = await prisma.systemBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        sentBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error("Fetch broadcasts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const broadcast = await prisma.systemBroadcast.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        sentById: user.id,
      },
    });

    // Real-time broadcast via Socket.io to ALL connected clients
    const io = (global as unknown as { io?: SocketIOServer }).io;
    if (io) {
      io.emit("broadcast:new", {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        createdAt: broadcast.createdAt.toISOString(),
      });
    }

    return NextResponse.json({ success: true, broadcast }, { status: 201 });
  } catch (error) {
    console.error("Create broadcast error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
