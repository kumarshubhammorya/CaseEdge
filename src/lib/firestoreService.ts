import { collection, doc, setDoc, getDocs, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { telemetry } from './telemetry';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  // Record error to custom Telemetry/Sentry
  telemetry.recordError(error instanceof Error ? error : new Error(String(error)), errInfo);
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      arr[6] = (arr[6] & 0x0f) | 0x40; // v4
      arr[8] = (arr[8] & 0x3f) | 0x80; // variant
      const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0'));
      return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join('')
      ].join('-');
    } catch (e) {
      // Ignore and fall through to Math.random
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function saveCase(name: string, extractedText: string) {
  if (!auth.currentUser) throw new Error("Not logged in");
  
  const caseId = generateUUID();
  try {
    await setDoc(doc(db, 'cases', caseId), {
      ownerId: auth.currentUser.uid,
      name,
      extractedText,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'cases');
  }
  return caseId;
}

export async function getCases() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, 'cases'), where('ownerId', '==', auth.currentUser.uid));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'cases');
    return [];
  }
}

export async function deleteCase(id: string) {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'cases', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cases/${id}`);
  }
}
