export type Role = "USER" | "ADMIN";

export type MessageType = "TEXT" | "IMAGE" | "AUDIO" | "FILE";

export type MessageStatus = "SENT" | "DELIVERED" | "READ";

export interface UserSummary {
  id: string;
  phone: string;
  username: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  role: Role;
  isOnline: boolean;
  lastSeen: string | Date;
}

export interface ReactionItem {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface MessageItem {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string | null;
  status: MessageStatus;
  createdAt: string | Date;
  sender?: UserSummary;
  reactions?: ReactionItem[];
}

export interface ChatParticipantItem {
  id: string;
  chatId: string;
  userId: string;
  role: string;
  user: UserSummary;
}

export interface ChatItem {
  id: string;
  isGroup: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  participants: ChatParticipantItem[];
  messages?: MessageItem[];
  lastMessage?: MessageItem | null;
  unreadCount?: number;
}

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalChats: number;
  totalGroups: number;
  activeSockets: number;
  uptimeSeconds: number;
}

// WebSocket Event Payloads
export interface ServerToClientEvents {
  "message:new": (message: MessageItem) => void;
  "message:status": (data: { messageId: string; chatId: string; status: MessageStatus }) => void;
  "message:reaction": (data: { messageId: string; chatId: string; reaction: ReactionItem }) => void;
  "user:presence": (data: { userId: string; isOnline: boolean; lastSeen: string }) => void;
  "typing:status": (data: { chatId: string; userId: string; username: string; isTyping: boolean }) => void;
  "chat:created": (chat: ChatItem) => void;
  "broadcast:new": (data: { id: string; title: string; message: string; createdAt: string }) => void;
  "admin:stats": (stats: AdminStats) => void;
}

export interface ClientToServerEvents {
  "auth:identify": (userId: string) => void;
  "chat:join": (chatId: string) => void;
  "chat:leave": (chatId: string) => void;
  "message:send": (data: {
    chatId: string;
    content: string;
    type?: MessageType;
    mediaUrl?: string;
  }) => void;
  "message:read": (data: { messageId: string; chatId: string }) => void;
  "message:react": (data: { messageId: string; chatId: string; emoji: string }) => void;
  "typing:start": (chatId: string) => void;
  "typing:stop": (chatId: string) => void;
}
