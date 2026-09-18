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
      <div className="bg-[#11141b] border border-[#262b36] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1a1e27] px-4 py-3.5 flex items-center justify-between border-b border-[#262b36]">
          <h2 className="text-[#e8eaf0] font-medium text-lg">New Chat</h2>
          <button
            onClick={onClose}
            className="text-[#b4bac8] hover:text-white p-1 rounded-full hover:bg-[#232835] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#11141b] border-b border-[#262b36]">
          <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#6366f1]">
            <Search className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or phone number..."
              className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#1a1e27]/50">
          {isLoading ? (
            <div className="py-8 text-center text-[#8b93a7] text-sm">Searching contacts...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-[#8b93a7] text-sm">
              No contacts found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                disabled={creating}
                className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-[#1a1e27] transition-colors"
              >
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatarUrl}
                    alt={u.username}
                    className="w-11 h-11 rounded-full object-cover bg-[#1a1e27]"
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
                    <span className="font-medium text-[#e8eaf0] truncate">{u.username}</span>
                    <span className="text-xs text-[#8b93a7]">{u.phone}</span>
                  </div>
                  <p className="text-xs text-[#8b93a7] truncate mt-0.5">
                    {u.statusMessage || "Available"}
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-[#818cf8] opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
