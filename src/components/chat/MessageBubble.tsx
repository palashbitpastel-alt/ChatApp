"use client";

import React, { useState } from "react";
import { MessageItem, UserSummary } from "@/types";
import { formatMessageTime, getAvatarColor } from "@/lib/utils";
import { Check, CheckCheck, Smile } from "lucide-react";

interface MessageBubbleProps {
  message: MessageItem;
  currentUser: UserSummary | null;
  isGroup: boolean;
  onReact: (messageId: string, emoji: string) => void;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function MessageBubble({
  message,
  currentUser,
  isGroup,
  onReact,
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isSender = message.senderId === currentUser?.id;

  return (
    <div
      className={`group relative flex flex-col mb-1.5 px-4 ${
        isSender ? "items-end" : "items-start"
      }`}
    >
      {/* Emoji Reaction Popover on hover */}
      {showReactions && (
        <div
          className={`absolute -top-9 z-20 flex items-center space-x-1.5 bg-[#233138] border border-[#2e3b43] px-2 py-1 rounded-full shadow-lg animate-in fade-in zoom-in-95 ${
            isSender ? "right-6" : "left-6"
          }`}
          onMouseLeave={() => setShowReactions(false)}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(message.id, emoji);
                setShowReactions(false);
              }}
              className="text-lg hover:scale-125 transition-transform p-0.5 rounded-full"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm select-text ${
          isSender
            ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
            : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
        }`}
      >
        {/* Quick Reaction Button on message hover */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`absolute top-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-[#111b21]/70 hover:bg-[#111b21] text-[#8696a0] hover:text-[#e9edef] transition-opacity ${
            isSender ? "-left-8" : "-right-8"
          }`}
          title="React to message"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        {/* Sender Name for Group Chats */}
        {isGroup && !isSender && message.sender && (
          <p
            className={`text-xs font-semibold mb-0.5 ${getAvatarColor(
              message.sender.username
            )} text-white px-1.5 py-0.5 rounded inline-block`}
          >
            {message.sender.username}
          </p>
        )}

        {/* Media (if Image) */}
        {message.type === "IMAGE" && message.mediaUrl && (
          <div className="my-1 rounded-lg overflow-hidden max-h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.mediaUrl}
              alt="Attachment"
              className="w-full h-auto object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            />
          </div>
        )}

        {/* Media (if Audio / Voice Note) */}
        {message.type === "AUDIO" && (
          <div className="flex items-center space-x-2 py-1.5 pr-4">
            <span className="text-xl">🎤</span>
            <div className="flex-1">
              <div className="h-1.5 bg-[#8696a0]/30 rounded-full w-32 overflow-hidden">
                <div className="h-full bg-[#00a884] w-2/3" />
              </div>
              <span className="text-[10px] text-[#8696a0]">0:14 • Voice Note</span>
            </div>
          </div>
        )}

        {/* Text Content & Metadata inline */}
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-0.5">
          <span className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </span>

          <div className="flex items-center space-x-1 ml-auto pt-0.5 select-none text-[11px] text-[#8696a0] flex-shrink-0">
            <span>{formatMessageTime(message.createdAt)}</span>
            {isSender && (
              <span>
                {message.status === "READ" ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                ) : message.status === "DELIVERED" ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Display Reactions if any */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute -bottom-3 ${
              isSender ? "right-2" : "left-2"
            } flex items-center bg-[#233138] border border-[#2e3b43] rounded-full px-1.5 py-0.5 shadow space-x-1`}
          >
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => (
              <span key={emoji} className="text-xs">
                {emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-[#8696a0] font-semibold">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
