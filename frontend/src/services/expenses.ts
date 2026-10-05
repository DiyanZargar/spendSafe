import { apiRequest } from './api';
import { Expense, ExpenseCreatePayload, ExpenseListResponse, Category } from '../types';

export const expenseService = {
  async getExpenses(params: {
    start_date?: string;
    end_date?: string;
    category?: string;
    merchant?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ExpenseListResponse> {
    const query = new URLSearchParams();
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.category) query.set('category', params.category);
    if (params.merchant) query.set('merchant', params.merchant);
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.offset) query.set('offset', params.offset.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<ExpenseListResponse>(`/expenses${qs}`);
  },

  async getExpense(id: string): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${id}`);
  },

  async createExpense(data: ExpenseCreatePayload): Promise<Expense> {
    return apiRequest<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateExpense(id: string, data: Partial<ExpenseCreatePayload>): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    return apiRequest<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  async getCategories(): Promise<Category[]> {
    return apiRequest<Category[]>('/expenses/categories');
  },
};
