export interface User {
  id: string;
  email: string;
  full_name: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category_id?: string | null;
  category: string;
  merchant?: string | null;
  description?: string | null;
  occurred_at: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreatePayload {
  amount: number;
  currency?: string;
  category: string;
  merchant?: string;
  description?: string;
  occurred_at?: string;
  source?: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
  limit: number;
  offset: number;
}

export interface SpendingSummary {
  total_amount: number;
  transaction_count: number;
  average_amount: number;
  currency: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingTrendPoint {
  date: string;
  amount: number;
  count: number;
}

export interface DayOfWeekPoint {
  day: string;
  amount: number;
  count: number;
}

export interface TopMerchantPoint {
  merchant: string;
  amount: number;
  count: number;
}

export interface MonthlyComparison {
  current_month_total: number;
  previous_month_total: number;
  percentage_change: number;
  absolute_difference: number;
}

export interface AnalyticsDashboard {
  period: string;
  summary: SpendingSummary;
  categories: CategoryBreakdown[];
  trends: SpendingTrendPoint[];
  day_of_week: DayOfWeekPoint[];
  top_merchants: TopMerchantPoint[];
  comparison?: MonthlyComparison | null;
}

export interface Message {
  id: string;
  sender_type: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  channel: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  action_taken?: Record<string, any>;
}

export interface ChannelConnection {
  id: string;
  channel_type: string;
  external_identifier: string;
  is_active: boolean;
  created_at: string;
  settings?: Record<string, any>;
}

export interface ReportItem {
  id: string;
  period: string;
  report_type: string;
  status: string;
  data: Record<string, any>;
  file_path?: string;
  created_at: string;
}

export interface ChannelVerifyPayload {
  channel_type: string;
  credentials: Record<string, any>;
}

export interface ChannelVerifyResult {
  valid: boolean;
  message: string;
}

export interface LLMConfigResponse {
  configured: boolean;
  provider?: string | null;
  model?: string | null;
  masked_api_key?: string | null;
  base_url?: string | null;
}

export interface LLMConfigPayload {
  provider: string;
  model: string;
  api_key?: string;
  base_url?: string;
}

export interface LLMFetchModelsPayload {
  provider: string;
  api_key?: string;
  base_url?: string;
}

export interface LLMFetchModelsResult {
  success: boolean;
  models: string[];
  curl_command: string;
  message?: string;
}
