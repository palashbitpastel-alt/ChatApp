import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = params.id;

    // Verify user is a participant of this chat
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
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
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Mark unread messages sent by others as READ
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: user.id },
        status: { not: "READ" },
      },
      data: { status: "READ" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = params.id;
    const { content, type = "TEXT", mediaUrl } = await req.json();

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: "Message content or media is required" },
        { status: 400 }
      );
    }

    const isParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: user.id,
        content: content || "",
        type,
        mediaUrl: mediaUrl || null,
        status: "SENT",
      },
      include: {
        sender: {
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
        },
        reactions: true,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Post message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
