import { Controller, Get, Param } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  // API to check if a session exists for a user
  @Get('check-session/:userId')
  async checkSession(@Param('userId') userId: string) {
    const sessionExists = await this.mapService.checkExistingSession(userId);
    if (sessionExists) {
      return { sessionExists: true, message: 'Session found for user.' };
    } else {
      return { sessionExists: false, message: 'No session found for user.' };
    }
  }
}
