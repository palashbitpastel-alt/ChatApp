"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatItem, MessageItem, UserSummary, MessageType } from "@/types";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { useSocket } from "@/lib/socket";
import { Lock } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandLogo";
import { APP_NAME } from "@/lib/brand";

interface ChatWindowProps {
  chat: ChatItem | null;
  currentUser: UserSummary | null;
  onBackMobile: () => void;
  onUpdateLastMessage: (chatId: string, message: MessageItem) => void;
}

export default function ChatWindow({
  chat,
  currentUser,
  onBackMobile,
  onUpdateLastMessage,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, joinChat, leaveChat, sendSocketMessage, markAsRead, reactToMessage } =
    useSocket();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch initial messages when chat changes
  useEffect(() => {
    if (!chat) return;

    joinChat(chat.id);

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chats/${chat.id}/messages`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    return () => {
      leaveChat(chat.id);
    };
  }, [chat?.id]);

  // Real-time socket event listeners for this chat
  useEffect(() => {
    if (!socket || !chat) return;

    const handleNewMessage = (newMessage: MessageItem) => {
      if (newMessage.chatId === chat.id) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        onUpdateLastMessage(chat.id, newMessage);

        // If sent by someone else and we are viewing this chat, mark as read
        if (currentUser && newMessage.senderId !== currentUser.id) {
          markAsRead(newMessage.id, chat.id);
        }

        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    };

    const handleMessageStatus = (data: {
      messageId: string;
      chatId: string;
      status: "SENT" | "DELIVERED" | "READ";
    }) => {
      if (data.chatId === chat.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, status: data.status } : m))
        );
      }
    };

    const handleReaction = (data: {
      messageId: string;
      chatId: string;
      reaction: { id: string; messageId: string; userId: string; emoji: string };
    }) => {
      if (data.chatId === chat.id) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== data.messageId) return m;
            const existing = m.reactions || [];
            const filtered = existing.filter((r) => r.userId !== data.reaction.userId);
            return { ...m, reactions: [...filtered, data.reaction] };
          })
        );
      }
    };

    const handleReactionRemoved = (data: {
      messageId: string;
      chatId: string;
      userId: string;
    }) => {
      if (data.chatId === chat.id) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== data.messageId) return m;
            return {
              ...m,
              reactions: (m.reactions || []).filter((r) => r.userId !== data.userId),
            };
          })
        );
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleMessageStatus);
    socket.on("message:reaction", handleReaction);
    socket.on("message:reaction:removed", handleReactionRemoved);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.off("message:reaction", handleReaction);
      socket.off("message:reaction:removed", handleReactionRemoved);
    };
  }, [socket, chat?.id, currentUser?.id]);

  const handleSendMessage = (
    content: string,
    type: MessageType = "TEXT",
    mediaUrl?: string
  ) => {
    if (!chat || !currentUser) return;

    sendSocketMessage({
      chatId: chat.id,
      senderId: currentUser.id,
      content,
      type,
      mediaUrl,
    });
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!chat || !currentUser) return;
    reactToMessage(messageId, chat.id, currentUser.id, emoji);
  };

  // 1. Empty State (when no chat is selected)
  if (!chat) {
    return (
      <main className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center select-none chat-bg">
        <div className="max-w-md space-y-4">
          <BrandMark className="w-16 h-16 mx-auto mb-4" />

          <h2 className="text-2xl font-semibold tracking-tight text-[#e8eaf0]">{APP_NAME}</h2>
          <p className="text-sm text-[#8b93a7] leading-relaxed">
            Select a conversation from the list, or start a new chat to begin messaging.
          </p>

          <div className="pt-6 flex items-center justify-center space-x-2 text-xs text-[#8b93a7]">
            <Lock className="w-3.5 h-3.5 text-[#8b93a7]" />
            <span>Messages are delivered instantly over a secure connection</span>
          </div>
        </div>
      </main>
    );
  }

  // 2. Active Chat Window
  return (
    <main className="flex-1 flex flex-col h-full bg-[#0b0d12] overflow-hidden relative">
      {/* Header */}
      <ChatHeader
        chat={chat}
        currentUser={currentUser}
        onBackMobile={onBackMobile}
      />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto chat-bg p-2 sm:p-4 space-y-2">
        {/* Encryption notice banner */}
        <div className="flex justify-center my-3">
          <div className="bg-[#161a22] border border-[#262b36] rounded-lg px-3 py-1.5 flex items-center space-x-2 text-[11px] text-[#ffd279] shadow-sm max-w-sm text-center">
            <Lock className="w-3 h-3 flex-shrink-0" />
            <span>Messages are secured with real-time WebSocket protocol.</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#8b93a7]">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8b93a7]">
            No messages here yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUser={currentUser}
              isGroup={chat.isGroup}
              onReact={handleReact}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input */}
      <ChatInput
        chatId={chat.id}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
      />
    </main>
  );
}
