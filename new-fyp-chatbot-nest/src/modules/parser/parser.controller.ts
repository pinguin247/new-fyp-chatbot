import { Controller, Post, Body } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('parser')
export class ParserController {
  constructor(
    private readonly parserService: ParserService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('parse-and-upload')
  async parseAndUpload(@Body('folderPath') folderPath: string) {
    console.log('Entered path is: ' + folderPath);
    const parsedRecords = this.parserService.parseFolder(folderPath);
    const savedRecords =
      await this.supabaseService.insertParsedRecords(parsedRecords);
    return savedRecords;
  }
}
