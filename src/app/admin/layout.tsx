"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserSummary } from "@/types";
import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandLogo";
import { APP_NAME } from "@/lib/brand";
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
      <div className="h-dvh w-screen flex flex-col items-center justify-center bg-[#0b0d12] text-[#818cf8] space-y-3">
        <Shield className="w-12 h-12 animate-pulse" />
        <p className="text-xs text-[#8b93a7] font-medium tracking-wide uppercase">
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
    <div className="flex h-dvh w-screen bg-[#0b0d12] text-[#e8eaf0] overflow-hidden select-none">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#11141b] border-r border-[#262b36] flex flex-col justify-between">
        <div>
          {/* Admin Header */}
          <div className="p-4 border-b border-[#262b36] flex items-center space-x-3 bg-[#1a1e27]/40">
            <BrandMark className="w-9 h-9" />
            <div>
              <h1 className="font-semibold text-sm text-[#e8eaf0]">{APP_NAME} Admin</h1>
              <p className="text-[11px] text-[#818cf8] flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] mr-1.5 animate-ping" />
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
                      ? "bg-[#6366f1] text-white font-semibold shadow"
                      : "text-[#8b93a7] hover:text-[#e8eaf0] hover:bg-[#1a1e27]"
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
        <div className="p-3 border-t border-[#262b36] space-y-1 bg-[#11141b]">
          <Link
            href="/"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-[#8b93a7] hover:text-[#818cf8] hover:bg-[#1a1e27] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to chats</span>
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0d12]">
        {/* Top Navbar */}
        <header className="h-14 bg-[#1a1e27] border-b border-[#262b36] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[#8b93a7]">
            <Activity className="w-4 h-4 text-[#818cf8]" />
            <span>Server Status: <strong className="text-emerald-400 font-semibold">Operational (Railway)</strong></span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-[#8b93a7]">Logged in as</span>
            <span className="text-xs font-semibold text-[#818cf8] bg-[#6366f1]/10 px-2.5 py-1 rounded-md border border-[#6366f1]/30">
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
