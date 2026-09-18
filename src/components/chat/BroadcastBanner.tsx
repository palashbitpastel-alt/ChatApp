"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket";
import { Megaphone, X } from "lucide-react";

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function BroadcastBanner() {
  const { socket } = useSocket();
  const [broadcast, setBroadcast] = useState<BroadcastItem | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleBroadcast = (data: BroadcastItem) => {
      setBroadcast(data);
    };

    socket.on("broadcast:new", handleBroadcast);

    return () => {
      socket.off("broadcast:new", handleBroadcast);
    };
  }, [socket]);

  if (!broadcast) return null;

  return (
    <div className="bg-amber-600/95 text-white px-4 py-2.5 flex items-center justify-between text-sm shadow-md animate-fadeIn z-50">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="p-1 bg-black/20 rounded-full flex-shrink-0">
          <Megaphone className="w-4 h-4 text-amber-200" />
        </div>
        <div className="truncate">
          <span className="font-semibold text-amber-100 mr-2">[{broadcast.title}]:</span>
          <span>{broadcast.message}</span>
        </div>
      </div>
      <button
        onClick={() => setBroadcast(null)}
        className="p-1 hover:bg-black/20 rounded-full transition-colors flex-shrink-0 ml-4"
        title="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
