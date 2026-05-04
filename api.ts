import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  });
  return sanitized;
}

export async function fetchProfile() {
  const path = 'profile/main';
  try {
    const docRef = doc(db, 'profile', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return {};
  }
}

export async function fetchAssets(type?: string) {
  const path = 'assets';
  try {
    let q = query(collection(db, 'assets'));
    if (type) {
      q = query(collection(db, 'assets'), where('type', '==', type));
    }
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory to handle legacy docs without createdAt
    return data.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function fetchServices(mode?: 'model' | 'ba') {
  const path = 'services';
  try {
    let q = collection(db, 'services');
    if (mode) {
      // @ts-ignore
      q = query(q, where('mode', '==', mode));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      benefits: typeof (doc.data() as any).benefits === 'string' ? JSON.parse((doc.data() as any).benefits) : ((doc.data() as any).benefits || [])
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function fetchMilestones() {
  const path = 'milestones';
  try {
    const q = query(collection(db, 'milestones'), orderBy('year', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      projects: typeof (doc.data() as any).projects === 'string' ? JSON.parse((doc.data() as any).projects) : ((doc.data() as any).projects || [])
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function fetchBAProjects() {
  const path = 'ba_projects';
  try {
    const querySnapshot = await getDocs(collection(db, 'ba_projects'));
    const data = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      images: typeof (doc.data() as any).images === 'string' ? JSON.parse((doc.data() as any).images) : ((doc.data() as any).images || []),
      tags: typeof (doc.data() as any).tags === 'string' ? JSON.parse((doc.data() as any).tags) : ((doc.data() as any).tags || [])
    }));

    return data.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function fetchLifeHobbies() {
  const path = 'life_hobbies';
  try {
    const querySnapshot = await getDocs(collection(db, 'life_hobbies'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return data.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function fetchCalendar() {
  const path = 'calendar';
  try {
    const q = query(collection(db, 'calendar'), orderBy('date_str', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function saveProfile(data: any) {
  const path = 'profile/main';
  try {
    const docRef = doc(db, 'profile', 'main');
    await setDoc(docRef, { ...sanitizeData(data), updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAsset(data: any) {
  const path = 'assets';
  try {
    const timestamp = serverTimestamp();
    const sanitized = sanitizeData(data);
    if (sanitized.id) {
      const { id, ...rest } = sanitized;
      const docRef = doc(db, 'assets', id);
      await updateDoc(docRef, { ...rest, updatedAt: timestamp });
    } else {
      await addDoc(collection(db, 'assets'), { ...sanitized, createdAt: timestamp, updatedAt: timestamp });
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAsset(id: string) {
  const path = `assets/${id}`;
  try {
    await deleteDoc(doc(db, 'assets', id));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCalendar(data: any) {
  const path = 'calendar';
  try {
    const sanitized = sanitizeData(data);
    const q = query(collection(db, 'calendar'), where('date_str', '==', sanitized.date_str));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'calendar', snap.docs[0].id), { status: sanitized.status });
    } else {
      await addDoc(collection(db, 'calendar'), sanitized);
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveService(data: any) {
  const path = 'services';
  try {
    const timestamp = serverTimestamp();
    const sanitized = sanitizeData(data);
    if (sanitized.id) {
      const { id, ...rest } = sanitized;
      await updateDoc(doc(db, 'services', id), { ...rest, updatedAt: timestamp });
    } else {
      await addDoc(collection(db, 'services'), { ...sanitized, createdAt: timestamp, updatedAt: timestamp });
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteService(id: string) {
  const path = `services/${id}`;
  try {
    await deleteDoc(doc(db, 'services', id));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveMilestone(data: any) {
  const path = 'milestones';
  try {
    const timestamp = serverTimestamp();
    const sanitized = sanitizeData(data);
    if (sanitized.id) {
      const { id, ...rest } = sanitized;
      await updateDoc(doc(db, 'milestones', id), { ...rest, updatedAt: timestamp });
    } else {
      await addDoc(collection(db, 'milestones'), { ...sanitized, createdAt: timestamp, updatedAt: timestamp });
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMilestone(id: string) {
  const path = `milestones/${id}`;
  try {
    await deleteDoc(doc(db, 'milestones', id));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveBAProject(data: any) {
  const path = 'ba_projects';
  try {
    const timestamp = serverTimestamp();
    const sanitized = sanitizeData(data);
    if (sanitized.id) {
      const { id, ...rest } = sanitized;
      await updateDoc(doc(db, 'ba_projects', id), { ...rest, updatedAt: timestamp });
    } else {
      await addDoc(collection(db, 'ba_projects'), { ...sanitized, createdAt: timestamp, updatedAt: timestamp });
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBAProject(id: string) {
  const path = `ba_projects/${id}`;
  try {
    await deleteDoc(doc(db, 'ba_projects', id));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveLifeHobby(data: any) {
  const path = 'life_hobbies';
  try {
    const timestamp = serverTimestamp();
    const sanitized = sanitizeData(data);
    if (sanitized.id) {
      const { id, ...rest } = sanitized;
      await updateDoc(doc(db, 'life_hobbies', id), { ...rest, updatedAt: timestamp });
    } else {
      await addDoc(collection(db, 'life_hobbies'), { ...sanitized, createdAt: timestamp, updatedAt: timestamp });
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteLifeHobby(id: string) {
  const path = `life_hobbies/${id}`;
  try {
    await deleteDoc(doc(db, 'life_hobbies', id));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
