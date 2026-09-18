"use client";

import React from "react";
import { X, ShieldCheck, User as UserIcon, Phone, Info } from "lucide-react";
import { UserSummary } from "@/types";
import { getAvatarColor, getInitials } from "@/lib/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSummary | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#202c33] px-4 py-3.5 flex items-center justify-between border-b border-[#222e35]">
          <h2 className="text-[#e9edef] font-medium text-lg">Profile Info</h2>
          <button
            onClick={onClose}
            className="text-[#aebac1] hover:text-white p-1 rounded-full hover:bg-[#2a3942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar section */}
        <div className="p-6 flex flex-col items-center bg-[#0b141a]/60 border-b border-[#222e35]">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#202c33] shadow-lg"
            />
          ) : (
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-[#202c33] shadow-lg ${getAvatarColor(
                user.username
              )}`}
            >
              {getInitials(user.username)}
            </div>
          )}

          <h3 className="mt-3 text-lg font-semibold text-[#e9edef] flex items-center space-x-1.5">
            <span>{user.username}</span>
            {user.role === "ADMIN" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#00a884]/20 text-[#00a884]">
                <ShieldCheck className="w-3 h-3 mr-1" />
                ADMIN
              </span>
            )}
          </h3>
          <span className="text-xs text-[#8696a0] mt-0.5">
            {user.isOnline ? "🟢 Online" : "Offline"}
          </span>
        </div>

        {/* Info fields */}
        <div className="p-4 space-y-4">
          <div className="flex items-start space-x-3 text-sm">
            <UserIcon className="w-4 h-4 text-[#00a884] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#8696a0]">Username</p>
              <p className="text-[#e9edef] font-medium">{user.username}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-sm">
            <Phone className="w-4 h-4 text-[#00a884] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#8696a0]">Phone Number</p>
              <p className="text-[#e9edef] font-medium">{user.phone}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-sm">
            <Info className="w-4 h-4 text-[#00a884] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#8696a0]">About</p>
              <p className="text-[#e9edef]">{user.statusMessage || "Hey there! I am using WhatsApp."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
