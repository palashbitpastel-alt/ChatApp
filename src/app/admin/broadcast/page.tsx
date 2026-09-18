"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatChatTimestamp } from "@/lib/utils";

interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  sentBy: {
    id: string;
    username: string;
  };
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch("/api/admin/broadcast");
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts || []);
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || loading) return;

    setLoading(true);
    setErrorNotice(null);
    setSuccessNotice(false);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transmit broadcast");
      }

      setSuccessNotice(true);
      setTitle("");
      setMessage("");
      fetchBroadcasts();
      setTimeout(() => setSuccessNotice(false), 5000);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Error broadcasting message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#e9edef] tracking-tight flex items-center space-x-2">
          <Megaphone className="w-5 h-5 text-[#00a884]" />
          <span>Real-Time System Broadcast</span>
        </h2>
        <p className="text-xs text-[#8696a0] mt-1">
          Broadcast global announcements across all active WhatsApp user windows in real time via
          WebSockets.
        </p>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Broadcast Transmitted Successfully!</p>
            <p className="text-[11px] text-emerald-500/80">
              The announcement banner has been pushed live to all connected WebSocket clients.
            </p>
          </div>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Broadcast Composer Form */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#e9edef] mb-4">Compose Announcement</h3>

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1.5">
              Announcement Title / Tag
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Maintenance or Server Update"
              required
              className="w-full bg-[#202c33] border border-[#222e35] rounded-lg px-3.5 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:border-[#00a884]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1.5">
              Broadcast Message Content
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here. All active users will immediately see an alert banner at the top of their screen."
              required
              className="w-full bg-[#202c33] border border-[#222e35] rounded-lg px-3.5 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:border-[#00a884] resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !message.trim()}
              className="px-5 py-2.5 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-black font-semibold text-xs rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>{loading ? "Transmitting..." : "Send Global Broadcast"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Past Broadcasts List */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#e9edef] flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#8696a0]" />
          <span>Past Broadcast History</span>
        </h3>

        {broadcasts.length === 0 ? (
          <p className="text-xs text-[#8696a0] py-6 text-center">No broadcasts sent yet.</p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-[#202c33]/50 border border-[#222e35] rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#00a884]">[{b.title}]</span>
                  <span className="text-[11px] text-[#8696a0]">
                    {formatChatTimestamp(b.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#e9edef]">{b.message}</p>
                <p className="text-[10px] text-[#8696a0]">Sent by: @{b.sentBy.username}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
