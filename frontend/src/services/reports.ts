import { apiRequest } from './api';
import { ReportItem } from '../types';

export const reportService = {
  async generateReport(period: string = 'this_month', reportType: string = 'monthly'): Promise<ReportItem> {
    return apiRequest<ReportItem>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        period,
        report_type: reportType,
      }),
    });
  },

  async getReport(id: string): Promise<ReportItem> {
    return apiRequest<ReportItem>(`/reports/${id}`);
  },

  getDownloadUrl(id: string): string {
    const base = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api/v1`
      : '/api/v1';
    return `${base}/reports/download/${id}`;
  },
};
