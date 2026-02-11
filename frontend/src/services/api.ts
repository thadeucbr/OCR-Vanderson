import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long processing
});

export interface AnalysisResponse {
  success: boolean;
  analysisId: string;
  status: 'ok' | 'divergencies' | 'error';
  message: string;
  pdfContents: any[];
  divergencies: any[];
  timestamp: string;
}

export interface AnalysisHistoryResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const analysisAPI = {
  async uploadAndAnalyze(zipFile: File): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', zipFile);

    const response = await apiClient.post<AnalysisResponse>('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getAnalysisById(id: string): Promise<AnalysisResponse> {
    const response = await apiClient.get<AnalysisResponse>(`/analyses/${id}`);
    return response.data;
  },

  async getAnalyses(page: number = 1, limit: number = 10): Promise<AnalysisHistoryResponse> {
    const response = await apiClient.get<AnalysisHistoryResponse>('/analyses', {
      params: { page, limit },
    });
    return response.data;
  },
};
