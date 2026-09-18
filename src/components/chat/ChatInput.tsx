"use client";

import React, { useState, useRef } from "react";
import { Smile, Paperclip, Send, Image, X } from "lucide-react";
import { useSocket } from "@/lib/socket";
import { UserSummary, MessageType } from "@/types";

interface ChatInputProps {
  chatId: string;
  currentUser: UserSummary | null;
  onSendMessage: (content: string, type?: MessageType, mediaUrl?: string) => void;
}

const QUICK_EMOJIS = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "🙏", "😍", "🥳", "✨", "💯", "😎"];

export default function ChatInput({ chatId, currentUser, onSendMessage }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const { startTyping, stopTyping } = useSocket();
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle typing indicator debounce
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    if (!currentUser) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    startTyping(chatId, currentUser.id, currentUser.username);

    typingTimerRef.current = setTimeout(() => {
      stopTyping(chatId, currentUser.id, currentUser.username);
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (currentUser) {
      stopTyping(chatId, currentUser.id, currentUser.username);
    }

    onSendMessage(trimmed, "TEXT");
    setText("");
    setShowEmojis(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    onSendMessage("Photo", "IMAGE", imageUrl.trim());
    setImageUrl("");
    setImageModalOpen(false);
  };

  return (
    <div className="relative bg-[#1a1e27] px-4 py-2.5 flex items-end space-x-2 border-t border-[#262b36] select-none">
      {/* Quick Emoji Popover */}
      {showEmojis && (
        <div className="absolute bottom-16 left-4 bg-[#1f2430] border border-[#2c3240] rounded-xl p-3 shadow-xl z-30 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8b93a7]">Quick Emojis</span>
            <button
              onClick={() => setShowEmojis(false)}
              className="text-[#8b93a7] hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setText((prev) => prev + emoji);
                  setShowEmojis(false);
                  textareaRef.current?.focus();
                }}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attach Menu */}
      {showAttach && (
        <div className="absolute bottom-16 left-12 bg-[#1f2430] border border-[#2c3240] rounded-xl p-2 shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95">
          <button
            onClick={() => {
              setShowAttach(false);
              setImageModalOpen(true);
            }}
            className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-[#e8eaf0] hover:bg-[#161a22] rounded-lg transition-colors"
          >
            <Image className="w-4 h-4 text-purple-400" />
            <span>Photo / Image URL</span>
          </button>
        </div>
      )}

      {/* Image URL Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#11141b] border border-[#262b36] rounded-xl w-full max-w-sm p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-[#e8eaf0] mb-3">Send Image Attachment</h3>
            <form onSubmit={handleSendImage}>
              <input
                type="url"
                placeholder="Paste image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="w-full bg-[#1a1e27] border border-[#262b36] rounded-lg px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none focus:border-[#6366f1] mb-3"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#8b93a7] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#6366f1] text-white font-semibold text-xs rounded-lg hover:bg-[#4f46e5]"
                >
                  Send Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left controls */}
      <div className="flex items-center space-x-1 text-[#8b93a7]">
        <button
          onClick={() => {
            setShowEmojis(!showEmojis);
            setShowAttach(false);
          }}
          className="p-2 hover:text-[#e8eaf0] hover:bg-[#353b4a] rounded-full transition-colors"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setShowAttach(!showAttach);
            setShowEmojis(false);
          }}
          className="p-2 hover:text-[#e8eaf0] hover:bg-[#353b4a] rounded-full transition-colors"
          title="Attach"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      {/* Message input */}
      <div className="flex-1 bg-[#232835] rounded-lg flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#6366f1]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full resize-none max-h-28 py-1 leading-snug"
        />
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="p-2 bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:bg-[#232835] disabled:text-[#8b93a7] rounded-full transition-all flex-shrink-0"
        title="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
