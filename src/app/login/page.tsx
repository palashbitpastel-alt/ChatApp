"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Smartphone, User, ArrowRight, Zap, Users, CheckCheck } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import { APP_NAME, DEFAULT_STATUS } from "@/lib/brand";

const FEATURES = [
  { icon: Zap, title: "Instant delivery", text: "Messages, reactions, and typing indicators arrive the moment they're sent." },
  { icon: Users, title: "Groups and direct chats", text: "Talk one-on-one or bring the whole team into a group." },
  { icon: CheckCheck, title: "Read receipts and presence", text: "See who's online and when your messages have been read." },
];

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

  return (
    <div className="relative h-dvh w-screen bg-[#0b0d12] flex flex-col items-center select-none overflow-y-auto">
      {/* Top bar */}
      <header className="relative z-10 w-full shrink-0 px-6 md:px-12 py-5 flex items-center justify-between">
        <BrandLogo />
      </header>

      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_65%)]"
      />

      {/* Login card */}
      <div className="relative shrink-0 mt-4 md:mt-10 mb-12 w-[92%] max-w-4xl bg-[#11141b]/95 border border-[#262b36] rounded-2xl shadow-2xl shadow-black/40 p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-10 z-10">
        {/* Left column: product intro */}
        <div className="flex-1 space-y-7 pt-7 md:pt-0 border-t md:border-t-0 border-[#262b36] md:pr-10 md:border-r">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#e8eaf0] tracking-tight leading-tight">
              Conversations that happen in real time
            </h1>
            <p className="text-sm text-[#8b93a7] mt-3 leading-relaxed">
              {APP_NAME} keeps you connected with instant messaging, group chats, and live
              presence, right in your browser.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-[#6366f1]/15 text-[#818cf8] flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#e8eaf0]">{title}</p>
                  <p className="text-xs text-[#8b93a7] mt-0.5 leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: Form (shown first on small screens) */}
        <div className="flex-1 flex flex-col justify-center order-first md:order-none">
          {/* Tabs */}
          <div className="flex border-b border-[#262b36] mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`pb-2.5 font-medium text-sm transition-colors border-b-2 mr-6 ${
                !isRegister
                  ? "border-[#6366f1] text-[#818cf8]"
                  : "border-transparent text-[#8b93a7] hover:text-[#e8eaf0]"
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
                  ? "border-[#6366f1] text-[#818cf8]"
                  : "border-transparent text-[#8b93a7] hover:text-[#e8eaf0]"
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
                <label className="block text-xs font-semibold text-[#8b93a7] uppercase mb-1">
                  Phone Number or Username
                </label>
                <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#6366f1]">
                  <User className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Username or phone number"
                    required
                    className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b93a7] uppercase mb-1">
                  Password
                </label>
                <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#6366f1]">
                  <Lock className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Authenticating..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8b93a7] uppercase mb-1">
                  Username
                </label>
                <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#6366f1]">
                  <User className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    required
                    className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b93a7] uppercase mb-1">
                  Phone Number
                </label>
                <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#6366f1]">
                  <Smartphone className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    required
                    className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b93a7] uppercase mb-1">
                  Password
                </label>
                <div className="relative bg-[#1a1e27] rounded-lg flex items-center px-3 py-2 focus-within:ring-1 focus-within:ring-[#6366f1]">
                  <Lock className="w-4 h-4 text-[#8b93a7] mr-2 flex-shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b93a7] uppercase mb-1">
                  About / Status (Optional)
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder={DEFAULT_STATUS}
                  className="bg-[#1a1e27] rounded-lg px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#8b93a7] outline-none w-full focus:ring-1 focus:ring-[#6366f1]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
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
