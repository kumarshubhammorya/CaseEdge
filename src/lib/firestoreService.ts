import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, serverTimestamp, deleteField } from 'firebase/firestore';
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

export async function savePublicCase(
  title: string,
  description: string,
  industry: string,
  difficulty: string,
  extractedText: string
) {
  if (!auth.currentUser) throw new Error("Not logged in");
  
  const caseId = generateUUID();
  try {
    await setDoc(doc(db, 'public_cases', caseId), {
      ownerId: auth.currentUser.uid,
      ownerName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous User',
      title,
      description,
      industry,
      difficulty,
      extractedText,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'public_cases');
  }
  return caseId;
}

export async function getPublicCases() {
  const q = query(collection(db, 'public_cases'));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'public_cases');
    return [];
  }
}

export async function deletePublicCase(id: string) {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'public_cases', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `public_cases/${id}`);
  }
}

export async function updatePublicCase(
  id: string,
  data: {
    title: string;
    description: string;
    industry: string;
    difficulty: string;
    extractedText: string;
  }
) {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'public_cases', id), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `public_cases/${id}`);
  }
}

export async function getUserProfile(userId: string) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

export async function saveUserProfile(
  userId: string,
  data: { username: string; bio: string; dob: string; collegeName: string; photoURL?: string; tokens?: number }
) {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}

export async function updateUserTokens(userId: string, tokens: number) {
  try {
    await setDoc(doc(db, 'users', userId), {
      tokens: tokens,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/tokens`);
  }
}

export async function getAllUserProfiles() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export async function saveCaseAnalytics(data: {
  caseTitle: string;
  caseType: string;
  intakeScore: number;
  structuringScore: number;
  frameworkScore: number;
  totalTimeSeconds: number;
  isCompleted: boolean;
}) {
  if (!auth.currentUser) throw new Error("Not logged in");

  const analyticsId = generateUUID();
  try {
    await setDoc(doc(db, 'case_analytics', analyticsId), {
      ownerId: auth.currentUser.uid,
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `case_analytics/${analyticsId}`);
  }
  return analyticsId;
}

export async function getCaseAnalytics() {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, 'case_analytics'),
    where('ownerId', '==', auth.currentUser.uid)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'case_analytics');
    return [];
  }
}

export async function getSystemConfig() {
  try {
    const docRef = doc(db, 'system_config', 'default');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'system_config/default');
    return null;
  }
}

export async function saveSystemConfig(data: any) {
  try {
    await setDoc(doc(db, 'system_config', 'default'), {
      ...data,
      geminiApiKeyOverride: deleteField(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_config/default');
  }
}

export async function getSystemSecrets() {
  try {
    const docRef = doc(db, 'system_config', 'secrets');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'system_config/secrets');
    return null;
  }
}

export async function saveSystemSecrets(data: any) {
  try {
    await setDoc(doc(db, 'system_config', 'secrets'), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_config/secrets');
  }
}

