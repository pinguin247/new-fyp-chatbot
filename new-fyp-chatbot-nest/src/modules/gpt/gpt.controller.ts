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
}
