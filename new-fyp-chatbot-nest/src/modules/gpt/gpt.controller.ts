import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './gpt.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async GPTResponse(@Body('content') content: string) {
    return this.chatService.chatWithGPT(content);
  }
}
