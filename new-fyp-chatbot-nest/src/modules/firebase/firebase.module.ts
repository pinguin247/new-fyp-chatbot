import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ParserModule } from '../parser/parser.module'; // Import the ParserModule

@Module({
  imports: [ParserModule], // Include ParserModule in imports
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
