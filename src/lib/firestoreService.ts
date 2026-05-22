import { collection, doc, setDoc, getDocs, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveCase(name: string, extractedText: string) {
  if (!auth.currentUser) throw new Error("Not logged in");
  
  const caseId = crypto.randomUUID();
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
