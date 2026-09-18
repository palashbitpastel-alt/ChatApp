"use client";

import React, { useState, useRef, useEffect } from "react";
import { Smile, Paperclip, Send, Mic, Image, FileText, X } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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

  // Simulated Voice Note recording
  const handleToggleVoice = () => {
    if (isRecording) {
      // Finish and send voice note
      setIsRecording(false);
      onSendMessage(`Voice message (${recordingSeconds}s)`, "AUDIO");
      setRecordingSeconds(0);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    onSendMessage("Photo", "IMAGE", imageUrl.trim());
    setImageUrl("");
    setImageModalOpen(false);
  };

  return (
    <div className="relative bg-[#202c33] px-4 py-2.5 flex items-end space-x-2 border-t border-[#222e35] select-none">
      {/* Quick Emoji Popover */}
      {showEmojis && (
        <div className="absolute bottom-16 left-4 bg-[#233138] border border-[#2e3b43] rounded-xl p-3 shadow-xl z-30 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8696a0]">Quick Emojis</span>
            <button
              onClick={() => setShowEmojis(false)}
              className="text-[#8696a0] hover:text-white p-0.5 rounded"
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
        <div className="absolute bottom-16 left-12 bg-[#233138] border border-[#2e3b43] rounded-xl p-2 shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95">
          <button
            onClick={() => {
              setShowAttach(false);
              setImageModalOpen(true);
            }}
            className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-[#e9edef] hover:bg-[#182229] rounded-lg transition-colors"
          >
            <Image className="w-4 h-4 text-purple-400" />
            <span>Photo / Image URL</span>
          </button>
          <button
            onClick={() => {
              setShowAttach(false);
              onSendMessage("📄 Document: Project_Specs_2026.pdf", "FILE");
            }}
            className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-[#e9edef] hover:bg-[#182229] rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Document Attachment</span>
          </button>
        </div>
      )}

      {/* Image URL Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111b21] border border-[#222e35] rounded-xl w-full max-w-sm p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-[#e9edef] mb-3">Send Image Attachment</h3>
            <form onSubmit={handleSendImage}>
              <input
                type="url"
                placeholder="Paste image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="w-full bg-[#202c33] border border-[#222e35] rounded-lg px-3 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:border-[#00a884] mb-3"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#8696a0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#00a884] text-black font-semibold text-xs rounded-lg hover:bg-[#02906f]"
                >
                  Send Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left controls */}
      {!isRecording && (
        <div className="flex items-center space-x-1 text-[#8696a0]">
          <button
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowAttach(false);
            }}
            className="p-2 hover:text-[#e9edef] hover:bg-[#374248] rounded-full transition-colors"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setShowAttach(!showAttach);
              setShowEmojis(false);
            }}
            className="p-2 hover:text-[#e9edef] hover:bg-[#374248] rounded-full transition-colors"
            title="Attach"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input area or Recording state */}
      {isRecording ? (
        <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2.5 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2 text-rose-400 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Recording voice note... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
          </div>
          <button
            onClick={() => setIsRecording(false)}
            className="text-xs text-[#8696a0] hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full resize-none max-h-28 py-1 leading-snug"
          />
        </div>
      )}

      {/* Right control: Send or Voice Record */}
      {text.trim() || isRecording ? (
        <button
          onClick={isRecording ? handleToggleVoice : handleSend}
          className="p-2 bg-[#00a884] text-black hover:bg-[#02906f] rounded-full transition-all flex-shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleToggleVoice}
          className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374248] rounded-full transition-colors flex-shrink-0"
          title="Voice message"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
