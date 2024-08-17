import { Controller, Get, Param } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ParserService } from '../parser/parser.service';

@Controller('api/data')
export class AppController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly parserService: ParserService,
  ) {}

  @Get('parse-and-upload/')
  async parseAndUploadData(@Param('folderPath') folderPath: string) {
    try {
      // Parse the files in the folder and get the records
      const records = this.parserService.parseFolder("test/RDP2P0010");

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
}
