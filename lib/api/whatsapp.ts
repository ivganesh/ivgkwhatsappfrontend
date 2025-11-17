import { apiClient } from './client';

export interface ConnectWhatsAppDto {
  companyId: string;
  code: string;
}

export const whatsappApi = {
  connect: async (data: ConnectWhatsAppDto) => {
    const response = await apiClient.post('/whatsapp/connect', data);
    return response.data;
  },

  sendText: async (companyId: string, phoneNumber: string, message: string) => {
    const response = await apiClient.post('/whatsapp/send/text', {
      companyId,
      phoneNumber,
      message,
    });
    return response.data;
  },

  sendTemplate: async (
    companyId: string,
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    components?: any[]
  ) => {
    const response = await apiClient.post('/whatsapp/send/template', {
      companyId,
      phoneNumber,
      templateName,
      languageCode,
      components,
    });
    return response.data;
  },
};



