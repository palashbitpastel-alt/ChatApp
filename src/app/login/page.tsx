"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Smartphone, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          phone,
          password,
          statusMessage: statusMessage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click test account login helper
  const handleQuickLogin = async (quickUsername: string, quickPass: string) => {
    setIdentifier(quickUsername);
    setPassword(quickPass);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: quickUsername, password: quickPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user?.role === "ADMIN") {
        router.replace("/");
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0c1317] flex flex-col items-center select-none overflow-y-auto">
      {/* Top WhatsApp Web Green Banner */}
      <div className="w-full bg-[#00a884] h-52 flex items-start px-6 md:px-16 pt-7 shadow-md">
        <div className="flex items-center space-x-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp Logo"
            className="w-10 h-10"
          />
          <span className="text-white font-semibold text-sm tracking-wider uppercase">
            WhatsApp Web
          </span>
        </div>
      </div>

      {/* Login Card overlay */}
      <div className="-mt-32 mb-12 w-[92%] max-w-4xl bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8 z-10 animate-in fade-in zoom-in-95">
        {/* Left column: Quick Accounts & Instructions */}
        <div className="flex-1 space-y-6 md:pr-4 md:border-r md:border-[#222e35]">
          <div>
            <h1 className="text-2xl font-semibold text-[#e9edef] tracking-tight">
              Use WhatsApp on your Web Browser
            </h1>
            <p className="text-sm text-[#8696a0] mt-1">
              Real-time messaging with WebSockets, reactions, and admin controls.
            </p>
          </div>

          <div className="bg-[#202c33]/60 rounded-xl p-4 border border-[#222e35]">
            <h3 className="text-xs font-semibold text-[#00a884] uppercase tracking-wider mb-2 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              1-Click Demo Accounts
            </h3>
            <p className="text-xs text-[#8696a0] mb-3">
              Click any profile below to instantly log in and test real-time chat:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                disabled={loading}
                className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#111b21] hover:bg-[#2a3942] border border-[#00a884]/40 hover:border-[#00a884] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center font-bold text-xs">
                  👑
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#e9edef]">Admin</p>
                  <p className="text-[10px] text-[#8696a0]">Full Controls</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("alice", "password123")}
                disabled={loading}
                className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#111b21] hover:bg-[#2a3942] border border-[#222e35] hover:border-[#00a884] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                  👩
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#e9edef]">Alice</p>
                  <p className="text-[10px] text-[#8696a0]">+10000000001</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("bob", "password123")}
                disabled={loading}
                className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#111b21] hover:bg-[#2a3942] border border-[#222e35] hover:border-[#00a884] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  👨
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#e9edef]">Bob</p>
                  <p className="text-[10px] text-[#8696a0]">+10000000002</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("charlie", "password123")}
                disabled={loading}
                className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#111b21] hover:bg-[#2a3942] border border-[#222e35] hover:border-[#00a884] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  🧑
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#e9edef]">Charlie</p>
                  <p className="text-[10px] text-[#8696a0]">+10000000003</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#8696a0]">
            <p className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#202c33] flex items-center justify-center text-[#e9edef] font-semibold text-[10px]">
                1
              </span>
              <span>Open in two tabs to test real-time chat between Alice and Bob.</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#202c33] flex items-center justify-center text-[#e9edef] font-semibold text-[10px]">
                2
              </span>
              <span>Log in as Admin to access the full moderation dashboard and global broadcast.</span>
            </p>
          </div>
        </div>

        {/* Right column: Form */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Tabs */}
          <div className="flex border-b border-[#222e35] mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`pb-2.5 font-medium text-sm transition-colors border-b-2 mr-6 ${
                !isRegister
                  ? "border-[#00a884] text-[#00a884]"
                  : "border-transparent text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
              className={`pb-2.5 font-medium text-sm transition-colors border-b-2 ${
                isRegister
                  ? "border-[#00a884] text-[#00a884]"
                  : "border-transparent text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {!isRegister ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1">
                  Phone Number or Username
                </label>
                <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#00a884]">
                  <User className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="alice or +10000000001"
                    required
                    className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1">
                  Password
                </label>
                <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#00a884]">
                  <Lock className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-black font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Authenticating..." : "Sign In to WhatsApp Web"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1">
                  Username
                </label>
                <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#00a884]">
                  <User className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    required
                    className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1">
                  Phone Number
                </label>
                <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#00a884]">
                  <Smartphone className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    required
                    className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1">
                  Password
                </label>
                <div className="relative bg-[#202c33] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#00a884]">
                  <Lock className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696a0] uppercase mb-1">
                  About / Status (Optional)
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="Hey there! I am using WhatsApp."
                  className="bg-[#202c33] rounded-lg px-3 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] outline-none w-full focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-black font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Creating Account..." : "Create Account & Join"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
