import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private firestore: Firestore, private storage: Storage) {}

  async addEvent(eventData: any, imageFile: File): Promise<void> {
    // 1. Upload slike
    let imageUrl = '';
    if (imageFile) {
      const filePath = `events/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
      const fileRef = ref(this.storage, filePath);
      await uploadBytes(fileRef, imageFile);
      imageUrl = await getDownloadURL(fileRef);
    }

    // 2. Spremi u Firestore
    const eventsCol = collection(this.firestore, 'events');
    await addDoc(eventsCol, {
      ...eventData,
      imageUrl,
      createdAt: new Date(),
    });
  }

  async listEvents(): Promise<any[]> {
    const eventsCol = collection(this.firestore, 'events');
    const snapshot = await getDocs(eventsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
