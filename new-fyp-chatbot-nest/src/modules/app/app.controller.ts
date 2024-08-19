import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('api/data')
export class AppController {
  constructor(
    private readonly parserService: ParserService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('parse-and-upload')
  async parseAndUpload(@Body('folderPath') folderPath: string) {
    const parsedRecords = this.parserService.parseFolder('test/RDP2P0010');
    const savedRecords =
      await this.supabaseService.insertParsedRecords(parsedRecords);
    return savedRecords;
  }

  @Get('users')
  async getAllUsers() {
    try {
      // Fetch all users from Supabase
      const users = await this.supabaseService.getAllUsers();
      return users;
    } catch (error) {
      return {
        message: 'An error occurred while fetching users',
        error: error.message,
      };
    }
  }
}
