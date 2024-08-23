import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
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
  async parseAndUpload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const allParsedRecords = [];

    try {
      for (const file of files) {
        const fileContent = file.buffer.toString('utf-8');
        const parsedRecords =
          this.parserService.parseTextFileContent(fileContent);
        allParsedRecords.push(...parsedRecords);
      }

      const savedRecords =
        await this.supabaseService.insertParsedRecords(allParsedRecords);
      return { success: true, savedRecords }; // Ensure a valid JSON response is returned
    } catch (error) {
      console.error('Error parsing files:', error);
      throw new BadRequestException('Failed to parse and upload files');
    }
  }
}
