import { Module } from '@nestjs/common';
import { ChatController } from './modules/gpt/gpt.controller';
import { ChatService } from './modules/gpt/gpt.service';
import { AppController } from './modules/app/app.controller';
import { ParserController } from './modules/parser/parser.controller';
import { ExerciseController } from './modules/exercise/exercise.controller';
import { MapController } from './modules/map/map.controller';
import { AppService } from './modules/app/app.service';
import { ParserService } from './modules/parser/parser.service';
import { SupabaseService } from './modules/supabase/supabase.service';
import { MapService } from './modules/map/map.service';
import { ExerciseService } from './modules/exercise/exercise.service';
import { PatientService } from './modules/patient/patient.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
    }),
  ],
  controllers: [
    ChatController,
    AppController,
    ParserController,
    ExerciseController,
    MapController,
  ],
  providers: [
    ChatService,
    AppService,
    ParserService,
    SupabaseService,
    MapService,
    ExerciseService,
    PatientService,
  ],
})
export class AppModule {}
