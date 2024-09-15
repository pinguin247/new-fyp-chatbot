import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Get,
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

  @Post('add-patient')
  async addNewPatient(@Body() doctorInputData: any) {
    try {
      const result = await this.supabaseService.addNewPatient(doctorInputData);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return { success: true, message: 'Patient added successfully' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('get-patient-names')
  async getPatientNames() {
    try {
      const patients = await this.supabaseService.getPatientNames();

      if (!patients || patients.length === 0) {
        throw new HttpException('No patients found', HttpStatus.NOT_FOUND);
      }

      return { patients };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while fetching patient names',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
