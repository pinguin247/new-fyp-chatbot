import { Module } from '@nestjs/common';
import { ChatController } from './modules/gpt/gpt.controller';
import { ChatService } from './modules/gpt/gpt.service';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';
import { FirebaseService } from './modules/firebase/firebase.service';
import { ParserService } from './modules/parser/parser.service';

@Module({
  imports: [],
  controllers: [ChatController, AppController],
  providers: [ChatService, AppService, FirebaseService, ParserService],
})
export class AppModule {}
