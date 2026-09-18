"use client";

import React, { useEffect, useState } from "react";
import { AdminStats } from "@/types";
import {
  Users,
  MessageSquare,
  Radio,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#e8eaf0] tracking-tight">
            System & Analytics Overview
          </h2>
          <p className="text-xs text-[#8b93a7] mt-1">
            Real-time telemetry from Next.js, Socket.io, and PostgreSQL instance.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="self-start sm:self-auto px-3 py-1.5 bg-[#1a1e27] hover:bg-[#232835] border border-[#262b36] text-[#e8eaf0] text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#11141b] border border-[#262b36] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8b93a7] uppercase tracking-wider">
              Total Users
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#e8eaf0]">
              {loading ? "..." : stats?.totalUsers || 0}
            </h3>
            <p className="text-[11px] text-[#8b93a7] mt-1 flex items-center">
              <span>Registered accounts</span>
            </p>
          </div>
        </div>

        {/* Live Online Sockets */}
        <div className="bg-[#11141b] border border-[#262b36] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#818cf8] uppercase tracking-wider">
              Live Connected
            </span>
            <div className="p-2 bg-[#6366f1]/10 text-[#818cf8] rounded-lg">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#818cf8]">
              {loading ? "..." : stats?.onlineUsers || 0}
            </h3>
            <p className="text-[11px] text-[#818cf8] mt-1 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] mr-1 animate-ping" />
              <span>Active WebSocket sessions</span>
            </p>
          </div>
        </div>

        {/* Total Messages */}
        <div className="bg-[#11141b] border border-[#262b36] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8b93a7] uppercase tracking-wider">
              Messages Sent
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#e8eaf0]">
              {loading ? "..." : stats?.totalMessages || 0}
            </h3>
            <p className="text-[11px] text-[#8b93a7] mt-1">Real-time chats & group msgs</p>
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-[#11141b] border border-[#262b36] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8b93a7] uppercase tracking-wider">
              Active Groups
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#e8eaf0]">
              {loading ? "..." : stats?.totalGroups || 0}
            </h3>
            <p className="text-[11px] text-[#8b93a7] mt-1">
              Out of {loading ? "..." : stats?.totalChats || 0} total chats
            </p>
          </div>
        </div>
      </div>

      {/* Railway & Architecture Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Deployment Status */}
        <div className="bg-[#11141b] border border-[#262b36] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#262b36] pb-3">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#818cf8]" />
              <h3 className="text-sm font-semibold text-[#e8eaf0]">
                Deployment & Runtime Environment
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Railway Ready
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#262b36]/50">
              <span className="text-[#8b93a7]">Process Architecture</span>
              <span className="text-[#e8eaf0] font-mono">Next.js App Router + Socket.io Server</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#262b36]/50">
              <span className="text-[#8b93a7]">Database Engine</span>
              <span className="text-[#e8eaf0] font-mono">PostgreSQL (Prisma ORM)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#262b36]/50">
              <span className="text-[#8b93a7]">Socket Transport</span>
              <span className="text-[#818cf8] font-mono">WebSocket (Persistent Engine.IO)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#8b93a7]">Node Process Uptime</span>
              <span className="text-[#e8eaf0] font-mono flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-[#8b93a7]" />
                {formatUptime(stats?.uptimeSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="bg-[#11141b] border border-[#262b36] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#e8eaf0] mb-2 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#818cf8]" />
              <span>Administrative Actions</span>
            </h3>
            <p className="text-xs text-[#8b93a7] mb-4">
              Direct tools to manage registered members or trigger global push announcements.
            </p>

            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-lg bg-[#1a1e27] hover:bg-[#232835] border border-[#262b36] transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-semibold text-[#e8eaf0]">User Management</p>
                    <p className="text-[10px] text-[#8b93a7]">
                      Review accounts, toggle ban status, or promote admins
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8b93a7] group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/broadcast"
                className="flex items-center justify-between p-3 rounded-lg bg-[#1a1e27] hover:bg-[#232835] border border-[#262b36] transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Radio className="w-4 h-4 text-[#818cf8]" />
                  <div>
                    <p className="text-xs font-semibold text-[#e8eaf0]">Broadcast Announcement</p>
                    <p className="text-[10px] text-[#8b93a7]">
                      Push immediate notification banners to all active users
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8b93a7] group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
