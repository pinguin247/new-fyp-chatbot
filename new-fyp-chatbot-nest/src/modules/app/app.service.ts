import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AppService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDataFromFirestore(collectionName: string) {
    const firestore = this.firebaseService.getFirestore();
    const snapshot = await firestore.collection(collectionName).get();
    const data = snapshot.docs.map((doc) => doc.data());
    return data;
  }
}
