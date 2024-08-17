import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as serviceAccount from './serviceAccountKey.json';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class FirebaseService {
  private firebaseApp: admin.app.App;

  constructor(private readonly parserService: ParserService) {
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
  }

  getFirestore() {
    return this.firebaseApp.firestore();
  }

  // Method to upload parsed data to Firebase
  async uploadToFirebase(records: any[]) {
    const db = this.getFirestore();
    const collectionRef = db.collection('tracker');

    let uploadCount = 0;
    for (const record of records) {
      const query = collectionRef
        .where('userID', '==', record.userID)
        .where('startDate', '==', record.startDate)
        .where('duration', '==', record.duration)
        .where('steps', '==', record.steps)
        .where('distance', '==', record.distance)
        .where('calories', '==', record.calories)
        .where('moderateIntensity', '==', record.moderateIntensity)
        .where('vigorousIntensity', '==', record.vigorousIntensity);

      const results = await query.get();
      let isDuplicate = false;

      results.forEach((doc) => {
        const data = doc.data();
        if (
          JSON.stringify(data.heartrate) === JSON.stringify(record.heartrate)
        ) {
          isDuplicate = true;
        }
      });

      if (!isDuplicate) {
        await collectionRef.add(record);
        uploadCount++;
        console.log(
          `Record for userID ${record.userID} uploaded successfully.`,
        );
      } else {
        console.log(
          `Duplicate record for userID ${record.userID} on ${record.startDate} skipped.`,
        );
      }
    }

    console.log(`Total number of records uploaded: ${uploadCount}`);
    return `Total number of records uploaded: ${uploadCount}`;
  }
}
