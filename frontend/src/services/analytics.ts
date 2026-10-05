import { apiRequest } from './api';
import { AnalyticsDashboard } from '../types';

export const analyticsService = {
  async getDashboard(params: {
    period?: string;
    custom_start?: string;
    custom_end?: string;
  } = {}): Promise<AnalyticsDashboard> {
    const query = new URLSearchParams();
    if (params.period) query.set('period', params.period);
    if (params.custom_start) query.set('custom_start', params.custom_start);
    if (params.custom_end) query.set('custom_end', params.custom_end);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<AnalyticsDashboard>(`/analytics/dashboard${qs}`);
  },
};
