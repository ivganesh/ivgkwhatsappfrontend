import { apiClient } from './client';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  timezone?: string;
  locale?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    companies?: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
    }>;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.get('/auth/verify-email', {
      params: { token },
    });
    return response.data;
  },
};



