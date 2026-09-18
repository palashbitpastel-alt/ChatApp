"use client";

import React, { useState } from "react";
import { ChatItem, UserSummary } from "@/types";
import { Users, Phone, Video, Search, MoreVertical, ArrowLeft } from "lucide-react";
import { formatChatTimestamp, getAvatarColor, getInitials } from "@/lib/utils";
import { useSocket } from "@/lib/socket";

interface ChatHeaderProps {
  chat: ChatItem;
  currentUser: UserSummary | null;
  onBackMobile: () => void;
  onOpenDetails: () => void;
}

export default function ChatHeader({
  chat,
  currentUser,
  onBackMobile,
  onOpenDetails,
}: ChatHeaderProps) {
  const { onlineUserIds, typingUsers } = useSocket();
  const [callNotice, setCallNotice] = useState<string | null>(null);

  const getOtherParticipant = () => {
    return chat.participants.find((p) => p.userId !== currentUser?.id)?.user;
  };

  const other = !chat.isGroup ? getOtherParticipant() : null;
  const displayName = chat.isGroup ? chat.name : other?.username || "Contact";
  const isOnline = other ? onlineUserIds.has(other.id) || other.isOnline : false;
  const typingUser = typingUsers.get(chat.id);
  const isTyping = Boolean(typingUser);

  const handleStartCall = (type: "audio" | "video") => {
    setCallNotice(`Starting ${type} call with ${displayName}...`);
    setTimeout(() => setCallNotice(null), 3000);
  };

  return (
    <div className="bg-[#202c33] px-4 py-2.5 flex items-center justify-between border-b border-[#222e35] select-none z-10">
      {/* Contact info & back button for mobile */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onBackMobile}
          className="md:hidden text-[#aebac1] hover:text-white p-1 rounded-full hover:bg-[#374248]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={onOpenDetails}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {chat.isGroup ? (
              chat.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={chat.avatarUrl}
                  alt={displayName || "Group"}
                  className="w-10 h-10 rounded-full object-cover bg-[#202c33]"
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
                className="w-10 h-10 rounded-full object-cover bg-[#202c33]"
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
            <h2 className="text-[#e9edef] font-medium text-sm sm:text-base leading-tight truncate group-hover:underline">
              {displayName}
            </h2>
            <div className="text-[12px] leading-tight truncate">
              {isTyping ? (
                <span className="text-[#00a884] font-medium animate-pulse">
                  {chat.isGroup ? `${typingUser} is typing...` : "typing..."}
                </span>
              ) : chat.isGroup ? (
                <span className="text-[#8696a0]">
                  {chat.participants.map((p) => p.user.username).join(", ")}
                </span>
              ) : isOnline ? (
                <span className="text-[#00a884] font-medium">online</span>
              ) : (
                <span className="text-[#8696a0]">
                  {other?.lastSeen
                    ? `last seen ${formatChatTimestamp(other.lastSeen)}`
                    : "offline"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1 sm:space-x-2 text-[#aebac1]">
        {callNotice && (
          <div className="hidden sm:block text-xs bg-[#00a884]/20 text-[#00a884] px-2.5 py-1 rounded-full animate-pulse mr-2">
            {callNotice}
          </div>
        )}

        <button
          onClick={() => handleStartCall("video")}
          className="p-2 hover:bg-[#374248] rounded-full transition-colors"
          title="Video call"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleStartCall("audio")}
          className="p-2 hover:bg-[#374248] rounded-full transition-colors"
          title="Voice call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-[#2e3b43] mx-1 hidden sm:block" />

        <button
          onClick={onOpenDetails}
          className="p-2 hover:bg-[#374248] rounded-full transition-colors"
          title="Search in chat"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenDetails}
          className="p-2 hover:bg-[#374248] rounded-full transition-colors"
          title="Chat details"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
