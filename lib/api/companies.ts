import { apiClient } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  timezone: string;
  locale: string;
  whatsappConnected: boolean;
  createdAt: string;
  updatedAt: string;
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

  getById: async (id: string): Promise<Company> => {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data;
  },
};

