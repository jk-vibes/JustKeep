import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function saveUserProfile(userId: string, profileData: any) {
  const finalPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profileData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, finalPath);
  }
}

export async function getUserProfile(userId: string) {
  const finalPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, finalPath);
  }
}

export function subscribeCollection(
  userId: string, 
  collectionName: string, 
  onUpdate: (items: any[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/${collectionName}`;
  const colRef = collection(db, 'users', userId, collectionName);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

export async function setDocItem(userId: string, collectionName: string, itemId: string, item: any) {
  const path = `users/${userId}/${collectionName}/${itemId}`;
  try {
    const docRef = doc(db, 'users', userId, collectionName, itemId);
    // Sanitize any undefined fields to null to avoid Firestore crashes
    const sanitized = JSON.parse(JSON.stringify(item, (_, v) => v === undefined ? null : v));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocItem(userId: string, collectionName: string, itemId: string) {
  const path = `users/${userId}/${collectionName}/${itemId}`;
  try {
    const docRef = doc(db, 'users', userId, collectionName, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchWriteItems(userId: string, collectionName: string, items: any[]) {
  const path = `users/${userId}/${collectionName}`;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      if (!item.id) return;
      const docRef = doc(db, 'users', userId, collectionName, item.id);
      const sanitized = JSON.parse(JSON.stringify(item, (_, v) => v === undefined ? null : v));
      batch.set(docRef, sanitized, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchDeleteItems(userId: string, collectionName: string, itemIds: string[]) {
  const path = `users/${userId}/${collectionName}`;
  try {
    const batch = writeBatch(db);
    itemIds.forEach((id) => {
      const docRef = doc(db, 'users', userId, collectionName, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
