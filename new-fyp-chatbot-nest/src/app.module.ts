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
import { UserAvailabilityService } from './modules/userAvailability/user_availability.service';
import { ExerciseAllocationService } from './modules/exercise/exercise_allocation.service';
import { FirebaseService } from './modules/notifications/firebase.service';
import { ExerciseSummaryService } from './modules/exercise/exercise_summary.service';
import { NotificationController } from './modules/notifications/notifications.controller';

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
    NotificationController,
  ],
  providers: [
    ChatService,
    AppService,
    ParserService,
    SupabaseService,
    MapService,
    ExerciseService,
    PatientService,
    UserAvailabilityService,
    ExerciseAllocationService,
    FirebaseService,
    ExerciseSummaryService,
  ],
})
export class AppModule {}
