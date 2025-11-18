import { apiClient } from './client';

export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  example?: any;
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface Template {
  id: string;
  companyId: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: TemplateStatus;
  components: TemplateComponent[];
  rejectionReason?: string | null;
  whatsappTemplateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatePayload {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: TemplateComponent[];
}

export const templatesApi = {
  list: async (companyId: string, page = 1, limit = 50) => {
    const response = await apiClient.get(`/templates?companyId=${companyId}&page=${page}&limit=${limit}`);
    return response.data;
  },

  create: async (companyId: string, payload: TemplatePayload) => {
    const response = await apiClient.post('/templates', {
      companyId,
      ...payload,
    });
    return response.data;
  },

  update: async (companyId: string, id: string, payload: Partial<TemplatePayload>) => {
    const response = await apiClient.patch(`/templates/${id}`, {
      companyId,
      ...payload,
    });
    return response.data;
  },

  remove: async (companyId: string, id: string) => {
    const response = await apiClient.delete(`/templates/${id}?companyId=${companyId}`);
    return response.data;
  },

  submit: async (companyId: string, id: string) => {
    const response = await apiClient.post(`/templates/${id}/submit?companyId=${companyId}`);
    return response.data;
  },

  sync: async (companyId: string) => {
    const response = await apiClient.post('/templates/sync', {
      companyId,
    });
    return response.data;
  },
};


