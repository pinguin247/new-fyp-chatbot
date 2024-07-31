import { Module } from '@nestjs/common';
import { ChatController } from './gpt.controller';
import { ChatService } from './gpt.service';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatService],
})
export class AppModule {}
