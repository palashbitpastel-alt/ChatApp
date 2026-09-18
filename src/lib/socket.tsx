"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { UserSummary, MessageType } from "@/types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: Set<string>;
  typingUsers: Map<string, string>; // chatId -> typing username
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendSocketMessage: (data: {
    chatId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    mediaUrl?: string;
  }) => void;
  markAsRead: (messageId: string, chatId: string) => void;
  reactToMessage: (messageId: string, chatId: string, userId: string, emoji: string) => void;
  startTyping: (chatId: string, userId: string, username: string) => void;
  stopTyping: (chatId: string, userId: string, username: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUserIds: new Set(),
  typingUsers: new Map(),
  joinChat: () => {},
  leaveChat: () => {},
  sendSocketMessage: () => {},
  markAsRead: () => {},
  reactToMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({
  currentUser,
  children,
}: {
  currentUser: UserSummary | null;
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!currentUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = ClientIO(window.location.origin, {
      path: "/api/socket/io",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    // The server authenticates the socket from the httpOnly session cookie.
    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    // Handle online presence
    socketInstance.on(
      "user:presence",
      (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (data.isOnline) {
            next.add(data.userId);
          } else {
            next.delete(data.userId);
          }
          return next;
        });
      }
    );

    // Handle typing status
    socketInstance.on(
      "typing:status",
      (data: { chatId: string; userId: string; username: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (data.isTyping) {
            next.set(data.chatId, data.username);
          } else {
            next.delete(data.chatId);
          }
          return next;
        });

        // Automatically clear typing after 4 seconds if no stop received
        if (data.isTyping) {
          const existing = typingTimeoutRef.current.get(data.chatId);
          if (existing) clearTimeout(existing);

          const timeout = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(data.chatId);
              return next;
            });
          }, 4000);

          typingTimeoutRef.current.set(data.chatId, timeout);
        }
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser?.id]);

  const joinChat = (chatId: string) => {
    if (socket) {
      socket.emit("chat:join", chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit("chat:leave", chatId);
    }
  };

  const sendSocketMessage = (data: {
    chatId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    mediaUrl?: string;
  }) => {
    if (socket && isConnected) {
      socket.emit("message:send", data);
    }
  };

  const markAsRead = (messageId: string, chatId: string) => {
    if (socket && isConnected) {
      socket.emit("message:read", { messageId, chatId });
    }
  };

  const reactToMessage = (messageId: string, chatId: string, userId: string, emoji: string) => {
    if (socket && isConnected) {
      socket.emit("message:react", { messageId, chatId, userId, emoji });
    }
  };

  const startTyping = (chatId: string, userId: string, username: string) => {
    if (socket && isConnected) {
      socket.emit("typing:start", { chatId, userId, username });
    }
  };

  const stopTyping = (chatId: string, userId: string, username: string) => {
    if (socket && isConnected) {
      socket.emit("typing:stop", { chatId, userId, username });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        typingUsers,
        joinChat,
        leaveChat,
        sendSocketMessage,
        markAsRead,
        reactToMessage,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
