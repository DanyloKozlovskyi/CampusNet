import { HubConnection } from "@microsoft/signalr";

export interface Message {
  id: string;
  senderId: string;
  conversationId: string;
  content?: string;
  mediaKey?: string;
  mediaContentType?: string;
  mediaType?: "image" | "video" | "audio";
  createdAt: string;
  isRead: boolean;
  sender?: {
    id: string;
    name?: string;
    logoKey?: string;
  };
}

export interface ConversationParticipant {
  userId: string;
  name?: string;
  logoKey?: string;
  logoContentType?: string;
}

// Backend sends numeric enum values
export enum ConversationType {
  Direct = 0,
  Group = 1,
  University = 2,
  Faculty = 3,
  Major = 4,
  MajorYear = 5,
}

export interface Conversation {
  conversationId: string;
  name?: string;
  type?: ConversationType;
  logoKey?: string;
  logoContentType?: string;
  universityDomain?: string;
  facultyCode?: string;
  major?: string;
  majorKey?: string;
  yearOfStudy?: number;
  lastMessage?: Message;
  participants: ConversationParticipant[];
  unreadCount: number;
}

export const isUniversityChatType = (type?: ConversationType): boolean => {
  return (
    type === ConversationType.University ||
    type === ConversationType.Faculty ||
    type === ConversationType.Major ||
    type === ConversationType.MajorYear
  );
};

export interface ParticipantsPage {
  participants: ConversationParticipant[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ChatState {
  connection: HubConnection | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
}
