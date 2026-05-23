import api from "@shared/api/interceptor-api";
import { Message, Conversation, ParticipantsPage } from "../model/types";

export const chatApi = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get("/messages/conversations");
    return response.data;
  },

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<Message[]> {
    const response = await api.get(`/messages/conversation/${conversationId}`, {
      params: {
        cursor: cursor,
        limit: limit,
      },
    });

    return response.data;
  },

  async startConversation(
    otherUserId: string,
  ): Promise<{ conversationId: string }> {
    const response = await api.post(
      "/messages/conversation/start",
      otherUserId,
    );
    return response.data;
  },

  async createGroupConversation(
    name: string,
    participantIds: string[],
    logoKey?: string,
    logoContentType?: string,
  ): Promise<{ conversationId: string }> {
    const response = await api.post("/messages/conversation/group", {
      name,
      participantIds,
      logoKey,
      logoContentType,
    });
    return response.data;
  },

  async joinUniversityChat(
    universityDomain: string,
    universityName: string,
  ): Promise<{ conversationId: string }> {
    const response = await api.post("/messages/conversation/university", {
      universityDomain,
      universityName,
    });
    return response.data;
  },

  async joinFacultyChat(
    universityDomain: string,
    facultyCode: string,
    facultyName: string,
  ): Promise<{ conversationId: string }> {
    const response = await api.post("/messages/conversation/faculty", {
      universityDomain,
      facultyCode,
      facultyName,
    });
    return response.data;
  },

  async joinMajorChat(
    universityDomain: string,
    facultyCode: string,
    majorKey: string,
    major: string,
  ): Promise<{ conversationId: string }> {
    const response = await api.post("/messages/conversation/major", {
      universityDomain,
      facultyCode,
      majorKey,
      major,
    });
    return response.data;
  },

  async joinMajorYearChat(
    universityDomain: string,
    facultyCode: string,
    majorKey: string,
    major: string,
    yearOfStudy: number,
  ): Promise<{ conversationId: string }> {
    const response = await api.post("/messages/conversation/major-year", {
      universityDomain,
      facultyCode,
      majorKey,
      major,
      yearOfStudy,
    });
    return response.data;
  },

  async leaveConversation(conversationId: string): Promise<void> {
    await api.post(`/messages/conversation/${conversationId}/leave`);
  },

  async getConversationParticipants(
    conversationId: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string,
  ): Promise<ParticipantsPage> {
    const response = await api.get(
      `/messages/conversation/${conversationId}/participants`,
      {
        params: { page, pageSize, search },
      },
    );
    return response.data;
  },
};
