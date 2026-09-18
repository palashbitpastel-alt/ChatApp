"use client";

import React, { useState, useEffect } from "react";
import { X, Search, UserCheck } from "lucide-react";
import { UserSummary, ChatItem } from "@/types";
import { getAvatarColor, getInitials } from "@/lib/utils";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatSelected: (chat: ChatItem) => void;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onChatSelected,
}: NewChatModalProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 250);
    return () => clearTimeout(debounce);
  }, [search, isOpen]);

  const handleSelectUser = async (targetUser: UserSummary) => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGroup: false,
          recipientId: targetUser.id,
        }),
      });
      const data = await res.json();
      if (data.chat) {
        onChatSelected(data.chat);
        onClose();
      }
    } catch (err) {
      console.error("Failed to initiate chat:", err);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#202c33] px-4 py-3.5 flex items-center justify-between border-b border-[#222e35]">
          <h2 className="text-[#e9edef] font-medium text-lg">New Chat</h2>
          <button
            onClick={onClose}
            className="text-[#aebac1] hover:text-white p-1 rounded-full hover:bg-[#2a3942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#111b21] border-b border-[#222e35]">
          <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]">
            <Search className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or phone number..."
              className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#202c33]/50">
          {isLoading ? (
            <div className="py-8 text-center text-[#8696a0] text-sm">Searching contacts...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-[#8696a0] text-sm">
              No contacts found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                disabled={creating}
                className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-[#202c33] transition-colors"
              >
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatarUrl}
                    alt={u.username}
                    className="w-11 h-11 rounded-full object-cover bg-[#202c33]"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(
                      u.username
                    )}`}
                  >
                    {getInitials(u.username)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#e9edef] truncate">{u.username}</span>
                    <span className="text-xs text-[#8696a0]">{u.phone}</span>
                  </div>
                  <p className="text-xs text-[#8696a0] truncate mt-0.5">
                    {u.statusMessage || "Available"}
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-[#00a884] opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
