import { apiRequest } from './api';
import { ChatResponse, Conversation } from '../types';

export const chatService = {
  async sendMessage(message: string, conversationId?: string, channel: string = 'web'): Promise<ChatResponse> {
    return apiRequest<ChatResponse>('/conversations/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        channel,
      }),
    });
  },

  async listConversations(): Promise<Conversation[]> {
    return apiRequest<Conversation[]>('/conversations');
  },

  async getConversation(id: string): Promise<Conversation> {
    return apiRequest<Conversation>(`/conversations/${id}`);
  },
};
