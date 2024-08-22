import { Module } from '@nestjs/common';
import { ChatController } from './modules/gpt/gpt.controller';
import { ChatService } from './modules/gpt/gpt.service';
import { AppController } from './modules/app/app.controller';
import { ParserController } from './modules/parser/parser.controller';
import { AppService } from './modules/app/app.service';
import { ParserService } from './modules/parser/parser.service';
import { SupabaseService } from './modules/supabase/supabase.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
    }),
  ],
  controllers: [ChatController, AppController, ParserController],
  providers: [ChatService, AppService, ParserService, SupabaseService],
})
export class AppModule {}
