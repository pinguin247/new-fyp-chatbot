import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('api/data')
export class AppController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('get-profile-id')
  async getProfileId(@Body('fullName') fullName: string) {
    if (!fullName) {
      throw new HttpException('Full name is required', HttpStatus.BAD_REQUEST);
    }

    const { id, error } =
      await this.supabaseService.getProfileIdByName(fullName);

    if (error) {
      // Throw an HttpException with the specific error message
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }

    return { profileId: id };
  }
}
