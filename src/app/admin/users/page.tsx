"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getAvatarColor, getInitials, formatChatTimestamp } from "@/lib/utils";

interface ManagedUser {
  id: string;
  phone: string;
  username: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  role: "USER" | "ADMIN";
  isBanned: boolean;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  _count: {
    messages: number;
    participants: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleToggleBan = async (targetUserId: string, currentStatus: boolean) => {
    setActionError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          isBanned: !currentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update ban status");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, isBanned: !currentStatus } : u))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error performing action");
    }
  };

  const handleToggleRole = async (targetUserId: string, currentRole: "USER" | "ADMIN") => {
    setActionError(null);
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error updating role");
    }
  };

  const handleDeleteUser = async (targetUserId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"?`)) {
      return;
    }

    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users?userId=${targetUserId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error deleting user");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#e9edef] tracking-tight">
            User Management & Moderation
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            Manage user permissions, review message counts, or ban/unban bad actors.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="self-start sm:self-auto px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] border border-[#222e35] text-[#e9edef] text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl p-3">
        <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#00a884]">
          <Search className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or phone number..."
            className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#8696a0]">
            <thead className="bg-[#202c33]/70 text-[#e9edef] uppercase text-[11px] font-semibold border-b border-[#222e35]">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-5 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222e35]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[#8696a0]">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[#8696a0]">
                    No users found matching &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#202c33]/30 transition-colors">
                    {/* User Info */}
                    <td className="px-5 py-3.5 flex items-center space-x-3">
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
                      <div>
                        <p className="font-semibold text-sm text-[#e9edef] flex items-center space-x-1.5">
                          <span>{u.username}</span>
                          {u.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-[#00a884]" title="Online" />
                          )}
                        </p>
                        <p className="text-[11px] text-[#8696a0] truncate max-w-xs">
                          {u.statusMessage || "—"}
                        </p>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 font-mono text-[#e9edef]">{u.phone}</td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {u.role === "ADMIN" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30">
                          <Shield className="w-3 h-3 mr-1" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#202c33] text-[#8696a0]">
                          USER
                        </span>
                      )}
                    </td>

                    {/* Ban Status */}
                    <td className="px-4 py-3.5">
                      {u.isBanned ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <Ban className="w-3 h-3 mr-1" />
                          BANNED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ACTIVE
                        </span>
                      )}
                    </td>

                    {/* Message Count */}
                    <td className="px-4 py-3.5 text-[#e9edef] font-medium">
                      {u._count.messages}
                    </td>

                    {/* Last Seen */}
                    <td className="px-4 py-3.5 text-[11px]">
                      {u.isOnline ? (
                        <span className="text-[#00a884] font-medium">Online now</span>
                      ) : (
                        formatChatTimestamp(u.lastSeen)
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {/* Toggle Ban */}
                      <button
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          u.isBanned
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white"
                        }`}
                        title={u.isBanned ? "Unban account" : "Suspend user"}
                      >
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>

                      {/* Toggle Role */}
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="px-2.5 py-1 rounded text-xs bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-[#222e35] transition-colors"
                        title="Toggle Admin/User role"
                      >
                        {u.role === "ADMIN" ? "Demote" : "Make Admin"}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1 text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors inline-block"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
