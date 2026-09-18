"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Check, Search } from "lucide-react";
import { UserSummary, ChatItem } from "@/types";
import { getAvatarColor, getInitials } from "@/lib/utils";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (chat: ChatItem) => void;
}

export default function NewGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: NewGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.users) {
          setAvailableUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch contacts for group:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.size === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGroup: true,
          name: groupName.trim(),
          memberIds: Array.from(selectedUserIds),
        }),
      });

      const data = await res.json();
      if (data.chat) {
        onGroupCreated(data.chat);
        onClose();
        setGroupName("");
        setSelectedUserIds(new Set());
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#202c33] px-4 py-3.5 flex items-center justify-between border-b border-[#222e35]">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-[#e9edef] font-medium text-lg">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#aebac1] hover:text-white p-1 rounded-full hover:bg-[#2a3942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup}>
          <div className="p-4 space-y-4">
            {/* Group Name input */}
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1.5">
                Group Subject
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Type group subject..."
                maxLength={40}
                required
                className="w-full bg-[#202c33] border border-[#222e35] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-colors"
              />
            </div>

            {/* Member selection count */}
            <div className="flex items-center justify-between text-xs text-[#8696a0]">
              <span>Add Group Participants</span>
              <span>{selectedUserIds.size} selected</span>
            </div>

            {/* Search filter */}
            <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]">
              <Search className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
              />
            </div>

            {/* Contact list */}
            <div className="max-h-56 overflow-y-auto divide-y divide-[#202c33]/50 border border-[#222e35] rounded-lg bg-[#0b141a]/50">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-[#8696a0]">Loading contacts...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8696a0]">No contacts available</div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.has(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? "bg-[#202c33]" : "hover:bg-[#202c33]/40"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            className="w-9 h-9 rounded-full object-cover bg-[#202c33]"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(
                              u.username
                            )}`}
                          >
                            {getInitials(u.username)}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-sm font-medium text-[#e9edef] truncate">
                            {u.username}
                          </p>
                          <p className="text-xs text-[#8696a0] truncate">{u.phone}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-[#00a884] border-[#00a884] text-black"
                            : "border-[#8696a0]/50"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="bg-[#202c33] px-4 py-3 flex items-center justify-end space-x-2 border-t border-[#222e35]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#8696a0] hover:text-[#e9edef] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || selectedUserIds.size === 0 || isSubmitting}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-black font-semibold text-sm rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>{isSubmitting ? "Creating..." : "Create Group"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
