import { apiClient } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  timezone: string;
  locale: string;
  whatsappConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetail extends Company {
  whatsappPhoneId?: string | null;
  whatsappBusinessId?: string | null;
  whatsappWebhookToken?: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCompanyDto {
  name: string;
  slug: string;
  timezone?: string;
  locale?: string;
}

export const companiesApi = {
  create: async (data: CreateCompanyDto): Promise<Company> => {
    const response = await apiClient.post('/companies', data);
    return response.data;
  },

  getAll: async (): Promise<Company[]> => {
    const response = await apiClient.get('/companies');
    return response.data;
  },

  getById: async (id: string): Promise<CompanyDetail> => {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCompanyDto>) => {
    const response = await apiClient.patch(`/companies/${id}`, data);
    return response.data;
  },
};




