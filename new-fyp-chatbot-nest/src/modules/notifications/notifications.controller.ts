import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { SupabaseService } from '../supabase/supabase.service';

interface SendNotificationDto {
  userId: string;
  title: string;
  body: string;
}

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('send')
  async sendNotification(@Body() notificationDto: SendNotificationDto) {
    const { userId, title, body } = notificationDto;

    try {
      console.log(`Fetching FCM token for user: ${userId}`);
      const fcmToken = await this.supabaseService.getFCMTokenForUser(userId);

      if (!fcmToken) {
        console.error(`FCM token not found for user: ${userId}`);
        throw new HttpException(
          'FCM token not found for user',
          HttpStatus.NOT_FOUND,
        );
      }

      console.log(`Sending notification to FCM token: ${fcmToken}`);
      const result = await this.firebaseService.sendNotification(
        fcmToken,
        title,
        body,
      );

      return { success: true, result };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new HttpException(
        error.message || 'Failed to send notification',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
