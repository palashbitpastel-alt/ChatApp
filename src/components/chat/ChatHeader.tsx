"use client";

import React from "react";
import { ChatItem, UserSummary } from "@/types";
import { Users, ArrowLeft } from "lucide-react";
import { formatChatTimestamp, getAvatarColor, getInitials } from "@/lib/utils";
import { useSocket } from "@/lib/socket";

interface ChatHeaderProps {
  chat: ChatItem;
  currentUser: UserSummary | null;
  onBackMobile: () => void;
}

export default function ChatHeader({
  chat,
  currentUser,
  onBackMobile,
}: ChatHeaderProps) {
  const { onlineUserIds, typingUsers } = useSocket();

  const getOtherParticipant = () => {
    return chat.participants.find((p) => p.userId !== currentUser?.id)?.user;
  };

  const other = !chat.isGroup ? getOtherParticipant() : null;
  const displayName = chat.isGroup ? chat.name : other?.username || "Contact";
  const isOnline = other ? onlineUserIds.has(other.id) || other.isOnline : false;
  const typingUser = typingUsers.get(chat.id);
  const isTyping = Boolean(typingUser);

  return (
    <div className="bg-[#1a1e27] px-4 py-2.5 flex items-center justify-between border-b border-[#262b36] select-none z-10">
      {/* Contact info & back button for mobile */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onBackMobile}
          className="md:hidden text-[#b4bac8] hover:text-white p-1 rounded-full hover:bg-[#353b4a]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {chat.isGroup ? (
              chat.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={chat.avatarUrl}
                  alt={displayName || "Group"}
                  className="w-10 h-10 rounded-full object-cover bg-[#1a1e27]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
              )
            ) : other?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={other.avatarUrl}
                alt={displayName || "User"}
                className="w-10 h-10 rounded-full object-cover bg-[#1a1e27]"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(
                  displayName || "User"
                )}`}
              >
                {getInitials(displayName || "User")}
              </div>
            )}
          </div>

          {/* Name & Presence Subtext */}
          <div className="min-w-0">
            <h2 className="text-[#e8eaf0] font-medium text-sm sm:text-base leading-tight truncate">
              {displayName}
            </h2>
            <div className="text-[12px] leading-tight truncate">
              {isTyping ? (
                <span className="text-[#818cf8] font-medium animate-pulse">
                  {chat.isGroup ? `${typingUser} is typing...` : "typing..."}
                </span>
              ) : chat.isGroup ? (
                <span className="text-[#8b93a7]">
                  {chat.participants.map((p) => p.user.username).join(", ")}
                </span>
              ) : isOnline ? (
                <span className="text-[#818cf8] font-medium">online</span>
              ) : (
                <span className="text-[#8b93a7]">
                  {other?.lastSeen
                    ? `last seen ${formatChatTimestamp(other.lastSeen)}`
                    : "offline"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
