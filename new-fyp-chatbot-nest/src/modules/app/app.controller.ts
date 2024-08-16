import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/data')
export class AppController {
  constructor(private readonly AppService: AppService) {}

  @Get('firestore/:collection')
  async getDataFromFirestore(@Param('collection') collection: string) {
    return this.AppService.getDataFromFirestore(collection);
  }
}
