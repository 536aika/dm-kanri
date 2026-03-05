import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { DmRecordForm } from './types';
import { todayJST, monthJST } from './lib/jst';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

const COLLECTION = 'dm_records';

export async function addDmRecord(form: DmRecordForm): Promise<string> {
  const firestore = getDb();
  const date = todayJST();
  const month = monthJST();
  const docRef = await addDoc(collection(firestore, COLLECTION), {
    userName: form.userName,
    accountLink: form.accountLink,
    businessType: form.businessType,
    followerRange: form.followerRange,
    hasChampagne: form.hasChampagne,
    hasChampagneTower: form.hasChampagneTower,
    sentAt: serverTimestamp(),
    date,
    month,
  });
  return docRef.id;
}

/**
 * Subscribe to today's record count (JST). If userName is given, counts only that user's records (per-person limit).
 * Returns unsubscribe function.
 */
export function subscribeTodayCount(
  onCount: (count: number) => void,
  userName?: string
): Unsubscribe {
  const firestore = getDb();
  const today = todayJST();
  const constraints = [where('date', '==', today)];
  if (userName?.trim()) {
    constraints.push(where('userName', '==', userName.trim()));
  }
  const q = query(collection(firestore, COLLECTION), ...constraints);
  return onSnapshot(q, (snapshot) => {
    onCount(snapshot.size);
  });
}
