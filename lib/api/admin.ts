import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  _count?: {
    companies: number;
  };
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  isSuperAdmin?: boolean;
  timezone?: string;
  locale?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  whatsappConnected: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    users: number;
    contacts: number;
    messages: number;
    campaigns: number;
  };
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  companies: {
    total: number;
    active: number;
    inactive: number;
  };
  messages: {
    total: number;
  };
  contacts: {
    total: number;
  };
  campaigns: {
    total: number;
  };
}

export const adminApi = {
  getStats: async (): Promise<SystemStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getAllUsers: async (page: number = 1, limit: number = 50) => {
    const response = await apiClient.get('/admin/users', {
      params: { page, limit },
    });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<CreateUserDto>): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  toggleUserStatus: async (id: string) => {
    const response = await apiClient.patch(`/admin/users/${id}/toggle-status`);
    return response.data;
  },

  getAllCompanies: async (page: number = 1, limit: number = 50) => {
    const response = await apiClient.get('/admin/companies', {
      params: { page, limit },
    });
    return response.data;
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const response = await apiClient.get(`/admin/companies/${id}`);
    return response.data;
  },

  toggleCompanyStatus: async (id: string) => {
    const response = await apiClient.patch(`/admin/companies/${id}/toggle-status`);
    return response.data;
  },
};




