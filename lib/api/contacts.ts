import { apiClient } from './client';

export interface Contact {
  id: string;
  companyId: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  countryCode?: string | null;
  tags: string[];
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContacts {
  data: Contact[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactPayload {
  phone: string;
  name?: string;
  email?: string;
  countryCode?: string;
  tags?: string[];
}

export const contactsApi = {
  list: async (companyId: string, page = 1, limit = 50) => {
    const response = await apiClient.get<PaginatedContacts>(
      `/contacts?companyId=${companyId}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  create: async (companyId: string, data: ContactPayload) => {
    const response = await apiClient.post('/contacts', {
      companyId,
      ...data,
    });
    return response.data;
  },

  update: async (companyId: string, id: string, data: ContactPayload) => {
    const response = await apiClient.patch(`/contacts/${id}`, {
      companyId,
      ...data,
    });
    return response.data;
  },

  delete: async (companyId: string, id: string) => {
    const response = await apiClient.delete(`/contacts/${id}?companyId=${companyId}`);
    return response.data;
  },

  import: async (companyId: string, contacts: ContactPayload[]) => {
    const response = await apiClient.post('/contacts/import', {
      companyId,
      contacts,
    });
    return response.data;
  },
};


