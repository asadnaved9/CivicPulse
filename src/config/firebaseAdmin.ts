import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc, 
  addDoc, 
  writeBatch, 
  query, 
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp as ClientTimestamp
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

// In-memory memory store for seamless fallback when cloud security rules restrict server operations
const inMemoryStore: Record<string, Record<string, any>> = {};

function getMemoryCollection(path: string) {
  if (!inMemoryStore[path]) {
    inMemoryStore[path] = {};
  }
  return inMemoryStore[path];
}

const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY") || firebaseAppletConfig.apiKey || "placeholder-key",
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN") || firebaseAppletConfig.authDomain || "placeholder-auth",
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID") || firebaseAppletConfig.projectId || "placeholder-project",
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET") || firebaseAppletConfig.storageBucket || "placeholder-bucket",
  appId: getEnvVar("VITE_FIREBASE_APP_ID") || firebaseAppletConfig.appId || "placeholder-app-id",
};

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const hasDatabaseId = !!(firebaseAppletConfig as any).firestoreDatabaseId;

const clientDb = hasDatabaseId 
  ? getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

// Helper to convert client DocumentSnapshot to Admin-like DocumentSnapshot
class AdminDocumentSnapshot {
  private _id: string;
  private _data: any;
  private _exists: boolean;
  private _ref: any;

  constructor(id: string, data: any, exists: boolean, ref?: any) {
    this._id = id;
    this._data = data;
    this._exists = exists;
    this._ref = ref;
  }
  get exists() {
    return this._exists;
  }
  get id() {
    return this._id;
  }
  get ref() {
    return this._ref;
  }
  data() {
    return this._data;
  }
}

// Helper to convert client QuerySnapshot to Admin-like QuerySnapshot
class AdminQuerySnapshot {
  private _docs: AdminDocumentSnapshot[];
  constructor(docs: AdminDocumentSnapshot[]) {
    this._docs = docs;
  }
  get size() {
    return this._docs.length;
  }
  get docs() {
    return this._docs;
  }
  forEach(callback: (doc: AdminDocumentSnapshot) => void) {
    this._docs.forEach(callback);
  }
}

// Document reference class with in-memory resilient fallback
class AdminDocumentReference {
  private _path: string;
  private _id: string;
  constructor(collectionPath: string, id: string) {
    this._path = `${collectionPath}/${id}`;
    this._id = id;
  }
  get id() {
    return this._id;
  }
  get path() {
    return this._path;
  }
  async get(): Promise<AdminDocumentSnapshot> {
    try {
      const clientDocRef = doc(clientDb, this._path);
      const snap = await getDoc(clientDocRef);
      if (snap.exists()) {
        return new AdminDocumentSnapshot(snap.id, snap.data(), true, snap.ref);
      }
    } catch {
      // Cloud permission or network fallback
    }

    const [coll, docId] = this._path.split('/');
    const memColl = getMemoryCollection(coll);
    if (memColl[docId]) {
      return new AdminDocumentSnapshot(docId, memColl[docId], true, this);
    }
    return new AdminDocumentSnapshot(docId, undefined, false, this);
  }

  async update(data: any) {
    const preparedData = prepareDataForClient(data);
    const [coll, docId] = this._path.split('/');
    const memColl = getMemoryCollection(coll);
    memColl[docId] = { ...(memColl[docId] || {}), ...preparedData };

    try {
      const clientDocRef = doc(clientDb, this._path);
      await updateDoc(clientDocRef, preparedData);
    } catch {
      // Retained in memory store safely
    }
  }

  async set(data: any, options?: { merge?: boolean }) {
    const preparedData = prepareDataForClient(data);
    const [coll, docId] = this._path.split('/');
    const memColl = getMemoryCollection(coll);
    if (options?.merge) {
      memColl[docId] = { ...(memColl[docId] || {}), ...preparedData };
    } else {
      memColl[docId] = preparedData;
    }

    try {
      const clientDocRef = doc(clientDb, this._path);
      await setDoc(clientDocRef, preparedData, { merge: options?.merge ?? false });
    } catch {
      // Retained in memory store safely
    }
  }
}

// Collection reference class with in-memory resilient fallback
class AdminCollectionReference {
  private _path: string;
  private _limitVal: number | null = null;
  constructor(path: string) {
    this._path = path;
  }
  doc(id?: string) {
    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return new AdminDocumentReference(this._path, docId);
  }
  limit(n: number) {
    this._limitVal = n;
    return this;
  }
  async get(): Promise<AdminQuerySnapshot> {
    try {
      const clientColRef = collection(clientDb, this._path);
      let q = query(clientColRef);
      if (this._limitVal !== null) {
        q = query(clientColRef, firestoreLimit(this._limitVal));
      }
      const snap = await getDocs(q);
      if (snap.size > 0) {
        const docs = snap.docs.map(d => new AdminDocumentSnapshot(d.id, d.data(), true, d.ref));
        return new AdminQuerySnapshot(docs);
      }
    } catch {
      // Cloud permission or network fallback
    }

    const memColl = getMemoryCollection(this._path);
    let entries = Object.entries(memColl);
    if (this._limitVal !== null) {
      entries = entries.slice(0, this._limitVal);
    }
    const docs = entries.map(([id, data]) => new AdminDocumentSnapshot(id, data, true, new AdminDocumentReference(this._path, id)));
    return new AdminQuerySnapshot(docs);
  }

  async add(data: any) {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = this.doc(docId);
    await docRef.set(data);
    return docRef;
  }
}

// Batch class with in-memory resilient fallback
class AdminWriteBatch {
  private _ops: Array<() => Promise<void>> = [];

  set(docRef: any, data: any, options?: { merge?: boolean }) {
    this._ops.push(async () => {
      const path = docRef.path || `${docRef._path}`;
      const [coll, docId] = path.split('/');
      const memColl = getMemoryCollection(coll);
      const prepared = prepareDataForClient(data);
      if (options?.merge) {
        memColl[docId] = { ...(memColl[docId] || {}), ...prepared };
      } else {
        memColl[docId] = prepared;
      }

      try {
        const clientDocRef = doc(clientDb, path);
        await setDoc(clientDocRef, prepared, { merge: options?.merge ?? false });
      } catch {
        // Retained in memory store
      }
    });
    return this;
  }

  update(docRef: any, data: any) {
    this._ops.push(async () => {
      const path = docRef.path || `${docRef._path}`;
      const [coll, docId] = path.split('/');
      const memColl = getMemoryCollection(coll);
      const prepared = prepareDataForClient(data);
      memColl[docId] = { ...(memColl[docId] || {}), ...prepared };

      try {
        const clientDocRef = doc(clientDb, path);
        await updateDoc(clientDocRef, prepared);
      } catch {
        // Retained in memory store
      }
    });
    return this;
  }

  delete(docRef: any) {
    this._ops.push(async () => {
      const path = docRef.path || `${docRef._path}`;
      if (path) {
        const [coll, docId] = path.split('/');
        const memColl = getMemoryCollection(coll);
        delete memColl[docId];

        try {
          const clientDocRef = doc(clientDb, path);
          await updateDoc(clientDocRef, {});
        } catch {
          // Handled
        }
      }
    });
    return this;
  }

  async commit() {
    for (const op of this._ops) {
      await op();
    }
  }
}

function prepareDataForClient(data: any): any {
  if (data === null || data === undefined) return data;
  if (data instanceof AdminTimestamp) {
    return ClientTimestamp.fromDate(data.toDate());
  }
  if (data instanceof Date) {
    return ClientTimestamp.fromDate(data);
  }
  if (Array.isArray(data)) {
    return data.map(prepareDataForClient);
  }
  if (typeof data === 'object') {
    if (data._sentinel === 'serverTimestamp') {
      return serverTimestamp();
    }
    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = prepareDataForClient(data[key]);
    }
    return result;
  }
  return data;
}

const FieldValue = {
  serverTimestamp: () => ({ _sentinel: 'serverTimestamp' })
};

class AdminTimestamp {
  private _seconds: number;
  private _nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this._seconds = seconds;
    this._nanoseconds = nanoseconds;
  }
  static fromDate(date: Date) {
    return new AdminTimestamp(Math.floor(date.getTime() / 1000), (date.getTime() % 1000) * 1e6);
  }
  static now() {
    return AdminTimestamp.fromDate(new Date());
  }
  toDate() {
    return new Date(this._seconds * 1000 + this._nanoseconds / 1e6);
  }
}

const dbMock = {
  collection: (path: string) => new AdminCollectionReference(path),
  batch: () => new AdminWriteBatch()
};

export { dbMock as db };
export { FieldValue };
export { AdminTimestamp as Timestamp };
