"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserSummary } from "@/types";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  ArrowLeft,
  Shield,
  LogOut,
  Activity,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role !== "ADMIN") {
            router.replace("/");
            return;
          }
          setCurrentUser(data.user);
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b141a] text-[#00a884] space-y-3">
        <Shield className="w-12 h-12 animate-pulse" />
        <p className="text-xs text-[#8696a0] font-medium tracking-wide uppercase">
          Verifying Admin Credentials...
        </p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "ADMIN") return null;

  const navItems = [
    { href: "/admin", label: "Dashboard Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/broadcast", label: "System Broadcasts", icon: Megaphone },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#0b141a] text-[#e9edef] overflow-hidden select-none">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#111b21] border-r border-[#222e35] flex flex-col justify-between">
        <div>
          {/* Admin Header */}
          <div className="p-4 border-b border-[#222e35] flex items-center space-x-3 bg-[#202c33]/40">
            <div className="p-2 bg-[#00a884]/20 text-[#00a884] rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-[#e9edef]">WhatsApp Admin</h1>
              <p className="text-[11px] text-[#00a884] flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] mr-1.5 animate-ping" />
                Live Control Panel
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#00a884] text-black font-semibold shadow"
                      : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-[#222e35] space-y-1 bg-[#111b21]">
          <Link
            href="/"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to WhatsApp</span>
          </Link>

          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.replace("/login");
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0c1317]">
        {/* Top Navbar */}
        <header className="h-14 bg-[#202c33] border-b border-[#222e35] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[#8696a0]">
            <Activity className="w-4 h-4 text-[#00a884]" />
            <span>Server Status: <strong className="text-emerald-400 font-semibold">Operational (Railway)</strong></span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-[#8696a0]">Logged in as</span>
            <span className="text-xs font-semibold text-[#00a884] bg-[#00a884]/10 px-2.5 py-1 rounded-md border border-[#00a884]/30">
              {currentUser.username} (ADMIN)
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
