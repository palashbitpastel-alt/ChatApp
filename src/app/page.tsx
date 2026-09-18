"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserSummary, ChatItem, MessageItem } from "@/types";
import { SocketProvider, useSocket } from "@/lib/socket";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import NewChatModal from "@/components/chat/NewChatModal";
import NewGroupModal from "@/components/chat/NewGroupModal";
import ProfileModal from "@/components/chat/ProfileModal";
import BroadcastBanner from "@/components/chat/BroadcastBanner";

function WhatsAppAppContent({
  currentUser,
  onLogout,
}: {
  currentUser: UserSummary;
  onLogout: () => void;
}) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { socket } = useSocket();
  const chatsRef = useRef<ChatItem[]>([]);
  chatsRef.current = chats;

  // Load user's chats
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Listen for real-time chat updates & new messages in other chats
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: MessageItem) => {
      // A chat someone else just started with us isn't in the list yet
      if (!chatsRef.current.some((c) => c.id === msg.chatId)) {
        fetchChats();
        return;
      }
      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.id === msg.chatId) {
            const isCurrentChat = c.id === selectedChatId;
            const isFromOther = msg.senderId !== currentUser.id;
            return {
              ...c,
              lastMessage: msg,
              updatedAt: msg.createdAt,
              unreadCount: isCurrentChat || !isFromOther ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, selectedChatId, currentUser.id, fetchChats]);

  const handleSelectChat = (chat: ChatItem) => {
    setSelectedChatId(chat.id);
    // Clear unread count locally
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleUpdateLastMessage = (chatId: string, message: MessageItem) => {
    setChats((prevChats) =>
      prevChats
        .map((c) => (c.id === chatId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  };

  const handleChatCreated = (newChat: ChatItem) => {
    setChats((prev) => [newChat, ...prev.filter((c) => c.id !== newChat.id)]);
    setSelectedChatId(newChat.id);
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  return (
    <div className="flex flex-col h-dvh w-screen bg-[#0c1317] overflow-hidden">
      {/* Top Real-Time System Broadcast Alert Banner */}
      <BroadcastBanner />

      {/* Main WhatsApp Window Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Always visible on desktop, hidden on mobile when a chat is open */}
        <div
          className={`${
            selectedChatId ? "hidden md:flex" : "flex"
          } w-full md:w-auto h-full flex-shrink-0`}
        >
          <Sidebar
            currentUser={currentUser}
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onOpenNewChat={() => setNewChatOpen(true)}
            onOpenNewGroup={() => setNewGroupOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onLogout={onLogout}
          />
        </div>

        {/* Chat Window: Visible when selected on mobile, always visible on desktop */}
        <div
          className={`${
            selectedChatId ? "flex" : "hidden md:flex"
          } flex-1 h-full overflow-hidden`}
        >
          <ChatWindow
            chat={selectedChat}
            currentUser={currentUser}
            onBackMobile={() => setSelectedChatId(null)}
            onUpdateLastMessage={handleUpdateLastMessage}
          />
        </div>
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onChatSelected={handleChatCreated}
      />

      <NewGroupModal
        isOpen={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        onGroupCreated={handleChatCreated}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={currentUser}
      />
    </div>
  );
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setCurrentUser(null);
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="h-dvh w-screen flex flex-col items-center justify-center bg-[#111b21] text-[#00a884] space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="w-16 h-16 animate-pulse"
        />
        <div className="w-48 h-1 bg-[#202c33] rounded-full overflow-hidden">
          <div className="h-full bg-[#00a884] animate-[shimmer_1.5s_infinite] w-2/3" />
        </div>
        <p className="text-xs text-[#8696a0] font-medium tracking-wide uppercase">
          Loading WhatsApp Web...
        </p>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <SocketProvider currentUser={currentUser}>
      <WhatsAppAppContent currentUser={currentUser} onLogout={handleLogout} />
    </SocketProvider>
  );
}
