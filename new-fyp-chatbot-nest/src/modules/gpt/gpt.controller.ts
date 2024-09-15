import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './gpt.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('message')
  async GPTResponse(
    @Body('userId') userId: string,
    @Body('content') content: string,
  ) {
    return this.chatService.chatWithGPT(userId, content);
  }

  @Post('history')
  async getChatHistory(@Body('userId') userId: string) {
    return this.chatService.fetchChatHistory(userId);
  }

  @Post('saveMessage')
  async saveMessage(
    @Body('userId') userId: string,
    @Body('content') content: string,
    @Body('role') role: 'user' | 'system' | 'assistant',
  ) {
    await this.supabaseService.insertChatHistory(userId, role, content);
    return { success: true };
  }

  @Post('createSession')
  async createSession(
    @Body('userId') userId: string,
    @Body('exerciseId') exerciseId: string,
  ) {
    try {
      await this.chatService.createNewSession(userId, exerciseId);
      return { success: true, message: 'Session created successfully.' };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, message: 'Failed to create session.' };
    }
  }

  @Post('updateSession')
  async updateSession(
    @Body('userId') userId: string,
    @Body('exerciseId') exerciseId: string,
  ) {
    try {
      await this.chatService.updateSession(userId, exerciseId);
      return { success: true, message: 'Session updated successfully.' };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false, message: 'Failed to update session.' };
    }
  }
}
