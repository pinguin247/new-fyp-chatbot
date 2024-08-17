import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';

@Module({
  providers: [ParserService],
  exports: [ParserService], // Export the service so it can be used in other modules
})
export class ParserModule {}
