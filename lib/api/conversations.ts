import { apiClient } from './client';

export interface Conversation {
  id: string;
  contactId: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    name: string | null;
    phone: string;
    avatar: string | null;
  };
  messages: Array<{
    id: string;
    content: string | null;
    type: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: string;
    createdAt: string;
  }>;
}

export interface Message {
  id: string;
  content: string | null;
  type: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

export const conversationsApi = {
  getAll: async (companyId: string, page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(
      `/conversations?companyId=${companyId}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getMessages: async (
    companyId: string,
    contactId: string,
    page: number = 1,
    limit: number = 50
  ) => {
    const response = await apiClient.get(
      `/conversations/messages?companyId=${companyId}&contactId=${contactId}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (companyId: string, contactId: string) => {
    const response = await apiClient.get(
      `/conversations/${contactId}?companyId=${companyId}`
    );
    return response.data;
  },
};

