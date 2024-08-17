import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ParserService } from '../parser/parser.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('api/data')
export class AppController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly parserService: ParserService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get('parse-and-upload/')
  async parseAndUploadData(@Param('folderPath') folderPath: string) {
    try {
      // Parse the files in the folder and get the records
      const records = this.parserService.parseFolder('test/RDP2P0010');

      // Upload the records to Firebase
      await this.firebaseService.uploadToFirebase(records);

      return { message: 'Data parsed and uploaded successfully' };
    } catch (error) {
      return {
        message: 'An error occurred during parsing or uploading',
        error: error.message,
      };
    }
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
