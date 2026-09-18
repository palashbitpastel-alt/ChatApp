"use client";

import React, { useState } from "react";
import {
  MessageSquarePlus,
  Users,
  Search,
  MoreVertical,
  LogOut,
  Shield,
  CircleDot,
  Check,
  CheckCheck,
} from "lucide-react";
import { UserSummary, ChatItem } from "@/types";
import { formatChatTimestamp, getAvatarColor, getInitials } from "@/lib/utils";
import { useSocket } from "@/lib/socket";
import Link from "next/link";

interface SidebarProps {
  currentUser: UserSummary | null;
  chats: ChatItem[];
  selectedChatId: string | null;
  onSelectChat: (chat: ChatItem) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentUser,
  chats,
  selectedChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  onLogout,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "GROUPS">("ALL");
  const [menuOpen, setMenuOpen] = useState(false);
  const { onlineUserIds, typingUsers } = useSocket();

  // Helper to determine the other participant in a 1-on-1 chat
  const getOtherParticipant = (chat: ChatItem) => {
    return chat.participants.find((p) => p.userId !== currentUser?.id)?.user;
  };

  const filteredChats = chats.filter((chat) => {
    // 1. Text Search
    let chatName = chat.name || "";
    if (!chat.isGroup) {
      const other = getOtherParticipant(chat);
      chatName = other?.username || "";
    }

    const matchesSearch =
      chatName.toLowerCase().includes(search.toLowerCase()) ||
      chat.lastMessage?.content.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filter chips
    if (filter === "UNREAD") {
      return (chat.unreadCount || 0) > 0;
    }
    if (filter === "GROUPS") {
      return chat.isGroup;
    }

    return true;
  });

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 bg-[#11141b] border-r border-[#262b36] flex flex-col h-full select-none">
      {/* 1. Header */}
      <div className="bg-[#1a1e27] px-4 py-2.5 flex items-center justify-between border-b border-[#262b36] z-10">
        {/* User avatar & profile trigger */}
        <button
          onClick={onOpenProfile}
          className="flex items-center space-x-3 group text-left focus:outline-none"
          title="View profile"
        >
          <div className="relative">
            {currentUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#6366f1] transition-all"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                  currentUser?.username || "Me"
                )}`}
              >
                {getInitials(currentUser?.username || "Me")}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#6366f1] border-2 border-[#1a1e27] rounded-full" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#e8eaf0] leading-tight">
              {currentUser?.username}
            </p>
            <p className="text-[11px] text-[#818cf8] leading-tight">online</p>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center space-x-1 text-[#b4bac8] relative">
          {/* Admin Dashboard shortcut if admin */}
          {currentUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="p-2 hover:bg-[#353b4a] rounded-full transition-colors text-[#818cf8]"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}

          {/* New Group button */}
          <button
            onClick={onOpenNewGroup}
            className="p-2 hover:bg-[#353b4a] rounded-full transition-colors"
            title="New Group"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* New Chat button */}
          <button
            onClick={onOpenNewChat}
            className="p-2 hover:bg-[#353b4a] rounded-full transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-[#353b4a] rounded-full transition-colors"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#1f2430] border border-[#2c3240] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenNewGroup();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#d4d8e1] hover:bg-[#161a22] transition-colors"
                  >
                    New Group
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#d4d8e1] hover:bg-[#161a22] transition-colors"
                  >
                    Profile
                  </button>
                  {currentUser?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-[#818cf8] hover:bg-[#161a22] transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <hr className="my-1 border-[#2c3240]" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-[#161a22] flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Section */}
      <div className="p-2.5 bg-[#11141b] space-y-2 border-b border-[#262b36]">
        <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#6366f1] transition-all">
          <Search className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 px-1">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === "ALL"
                ? "bg-[#6366f1]/20 text-[#818cf8] font-semibold"
                : "bg-[#1a1e27] text-[#8b93a7] hover:text-[#d4d8e1]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("UNREAD")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === "UNREAD"
                ? "bg-[#6366f1]/20 text-[#818cf8] font-semibold"
                : "bg-[#1a1e27] text-[#8b93a7] hover:text-[#d4d8e1]"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("GROUPS")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === "GROUPS"
                ? "bg-[#6366f1]/20 text-[#818cf8] font-semibold"
                : "bg-[#1a1e27] text-[#8b93a7] hover:text-[#d4d8e1]"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* 3. Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1a1e27]/40">
        {filteredChats.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8b93a7] px-6">
            <CircleDot className="w-8 h-8 mx-auto mb-2 text-[#8b93a7]/40" />
            <p>No chats found.</p>
            <p className="text-xs mt-1 text-[#8b93a7]/80">
              Start a new conversation by clicking the message icon above.
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            const other = !chat.isGroup ? getOtherParticipant(chat) : null;
            const displayName = chat.isGroup ? chat.name : other?.username || "Unknown";
            const isOnline = other ? onlineUserIds.has(other.id) || other.isOnline : false;
            const typingUser = typingUsers.get(chat.id);
            const isTyping = Boolean(typingUser);

            const lastMsg = chat.lastMessage;
            const isSender = lastMsg?.senderId === currentUser?.id;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center px-3 py-3 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#232835]"
                    : "hover:bg-[#1a1e27] active:bg-[#262b36]"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 mr-3">
                  {chat.isGroup ? (
                    chat.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={chat.avatarUrl}
                        alt={displayName || "Group"}
                        className="w-12 h-12 rounded-full object-cover bg-[#1a1e27]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-white">
                        <Users className="w-6 h-6" />
                      </div>
                    )
                  ) : other?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={other.avatarUrl}
                      alt={displayName || "User"}
                      className="w-12 h-12 rounded-full object-cover bg-[#1a1e27]"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                        displayName || "User"
                      )}`}
                    >
                      {getInitials(displayName || "User")}
                    </div>
                  )}

                  {/* Presence indicator for direct chats */}
                  {!chat.isGroup && isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#6366f1] border-2 border-[#11141b] rounded-full" />
                  )}
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#e8eaf0] font-medium text-sm truncate">
                      {displayName}
                    </span>
                    <span
                      className={`text-[11px] ${
                        (chat.unreadCount || 0) > 0
                          ? "text-[#818cf8] font-semibold"
                          : "text-[#8b93a7]"
                      }`}
                    >
                      {formatChatTimestamp(lastMsg?.createdAt || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-[#8b93a7] truncate space-x-1">
                      {/* Typing indicator */}
                      {isTyping ? (
                        <span className="text-[#818cf8] font-medium animate-pulse">
                          {chat.isGroup ? `${typingUser} is typing...` : "typing..."}
                        </span>
                      ) : (
                        <>
                          {/* Checkmark ticks if sent by current user */}
                          {isSender && lastMsg && (
                            <span className="flex-shrink-0">
                              {lastMsg.status === "READ" ? (
                                <CheckCheck className="w-4 h-4 text-[#7dd3fc]" />
                              ) : lastMsg.status === "DELIVERED" ? (
                                <CheckCheck className="w-4 h-4 text-[#8b93a7]" />
                              ) : (
                                <Check className="w-4 h-4 text-[#8b93a7]" />
                              )}
                            </span>
                          )}

                          <span className="truncate">
                            {lastMsg?.type === "IMAGE"
                              ? "📷 Photo"
                              : lastMsg?.type === "AUDIO"
                              ? "🎤 Voice message"
                              : lastMsg?.content || "No messages yet"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Unread badge */}
                    {(chat.unreadCount || 0) > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-[#6366f1] text-[#11141b] font-bold text-[11px] h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
