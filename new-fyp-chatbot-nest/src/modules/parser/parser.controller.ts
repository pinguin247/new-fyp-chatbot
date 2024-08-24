import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParserService } from '../parser/parser.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('parser')
export class ParserController {
  constructor(
    private readonly parserService: ParserService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('parse-and-upload')
  @UseInterceptors(FilesInterceptor('files', 50)) // 'files' matches the field name in the frontend
  async parseAndUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('profileID') profileID: string, // Expecting profileID in request body
  ) {
    console.log(profileID);
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (!profileID) {
      throw new BadRequestException('Profile ID is required');
    }

    const allParsedRecords = [];

    try {
      for (const file of files) {
        const fileContent = file.buffer.toString('utf-8');
        const parsedRecords = this.parserService.parseTextFileContent(
          fileContent,
          profileID, // Ensure profileID is passed to the service
        );
        allParsedRecords.push(...parsedRecords);
      }

      const savedRecords =
        await this.supabaseService.insertParsedRecords(allParsedRecords);
      return { success: true, savedRecords };
    } catch (error) {
      console.error('Error parsing files:', error);
      throw new BadRequestException('Failed to parse and upload files');
    }
  }
}
