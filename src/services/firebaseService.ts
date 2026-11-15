import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CropType,
  FarmPlot,
  FarmSettings,
  FieldLogEntry,
  UserProfile,
  UserRole,
} from '../types/farm';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const BOOTSTRAP_ADMIN_EMAILS = new Set([
  'af491234567890@gmail.com',
  'youssef.520250017@ejust.edu.eg',
]);

async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testFirestoreConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGoogleAccount(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(result.user);
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: String(data.uid ?? user.uid),
        email: String(data.email ?? user.email ?? ''),
        displayName: String(data.displayName ?? user.displayName ?? 'Team Member'),
        role: data.role === 'farm_manager' ? 'farm_manager' : 'field_operator',
        assignedPlotCount:
          typeof data.assignedPlotCount === 'number' ? data.assignedPlotCount : 4,
      };
    }

    const isBootstrapAdmin =
      Boolean(user.emailVerified) &&
      typeof user.email === 'string' &&
      BOOTSTRAP_ADMIN_EMAILS.has(user.email);
    const initialRole: UserRole = isBootstrapAdmin ? 'farm_manager' : 'field_operator';

    await setDoc(ref, {
      uid: user.uid,
      email: (user.email ?? 'operator@owainat.local').slice(0, 200),
      displayName: (user.displayName ?? 'Field Operator').slice(0, 120),
      role: initialRole,
      assignedPlotCount: initialRole === 'farm_manager' ? 12 : 4,
      updatedAt: serverTimestamp(),
    });

    return {
      uid: user.uid,
      email: user.email ?? 'operator@owainat.local',
      displayName: user.displayName ?? 'Field Operator',
      role: initialRole,
      assignedPlotCount: initialRole === 'farm_manager' ? 12 : 4,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedPlotsIfManager(plots: FarmPlot[], user: User): Promise<void> {
  for (const plot of plots) {
    const path = `plots/${plot.plotCode}`;
    const ref = doc(db, 'plots', plot.plotCode);
    try {
      const existingSnap = await getDoc(ref);
      if (!existingSnap.exists()) {
        await setDoc(ref, {
          plotCode: plot.plotCode,
          cropType: plot.cropType,
          irrigating: plot.irrigating,
          flowRateM3Hr: plot.flowRateM3Hr,
          targetMoisturePct: plot.targetMoisturePct,
          sustainabilityCapM3Hr: plot.sustainabilityCapM3Hr,
          updatedByUid: user.uid,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export function subscribePlotsSync(
  onPlotsPatch: (
    patches: Record<
      string,
      Partial<
        Pick<
          FarmPlot,
          'cropType' | 'irrigating' | 'flowRateM3Hr' | 'targetMoisturePct' | 'sustainabilityCapM3Hr'
        >
      >
    >,
  ) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'plots';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const patches: Record<string, Partial<FarmPlot>> = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        patches[docSnap.id] = {
          cropType: d.cropType as CropType,
          irrigating: Boolean(d.irrigating),
          flowRateM3Hr: Number(d.flowRateM3Hr ?? 0),
          targetMoisturePct: Number(d.targetMoisturePct ?? 55),
          sustainabilityCapM3Hr: Number(d.sustainabilityCapM3Hr ?? 260),
        };
      });
      onPlotsPatch(patches);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export async function persistOperatorIrrigationChange(
  plot: FarmPlot,
  irrigating: boolean,
  flowRateM3Hr: number,
  uid: string,
): Promise<void> {
  const path = `plots/${plot.plotCode}`;
  const clampedFlow = Math.min(plot.sustainabilityCapM3Hr, Math.max(0, Math.round(flowRateM3Hr)));
  try {
    await updateDoc(doc(db, 'plots', plot.plotCode), {
      irrigating,
      flowRateM3Hr: irrigating ? clampedFlow : 0,
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function persistManagerPlotConfig(
  plot: FarmPlot,
  updates: {
    cropType: CropType;
    targetMoisturePct: number;
    sustainabilityCapM3Hr: number;
    irrigating: boolean;
    flowRateM3Hr: number;
  },
  uid: string,
): Promise<void> {
  const path = `plots/${plot.plotCode}`;
  try {
    await setDoc(doc(db, 'plots', plot.plotCode), {
      plotCode: plot.plotCode,
      cropType: updates.cropType,
      irrigating: updates.irrigating,
      flowRateM3Hr: Math.max(0, Math.min(500, Math.round(updates.flowRateM3Hr))),
      targetMoisturePct: Math.max(5, Math.min(60, Math.round(updates.targetMoisturePct))),
      sustainabilityCapM3Hr: Math.max(0, Math.min(500, Math.round(updates.sustainabilityCapM3Hr))),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistFieldLog(
  entry: Omit<FieldLogEntry, 'id' | 'createdAt'>,
): Promise<void> {
  const path = 'fieldLogs';
  try {
    await addDoc(collection(db, path), {
      plotCode: entry.plotCode,
      authorUid: entry.authorUid,
      authorName: entry.authorName.slice(0, 120),
      authorRole: entry.authorRole,
      category: entry.category,
      note: entry.note.trim().slice(0, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeFieldLogs(
  uid: string,
  role: UserRole,
  onLogs: (logs: FieldLogEntry[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'fieldLogs';
  const q =
    role === 'farm_manager'
      ? query(collection(db, path), orderBy('createdAt', 'desc'), limit(25))
      : query(
          collection(db, path),
          where('authorUid', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(25),
        );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FieldLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (role === 'farm_manager' || d.authorUid === uid) {
          list.push({
            id: docSnap.id,
            plotCode: String(d.plotCode ?? 'P-01'),
            authorUid: String(d.authorUid ?? ''),
            authorName: String(d.authorName ?? 'Team Member'),
            authorRole: d.authorRole === 'farm_manager' ? 'farm_manager' : 'field_operator',
            category: d.category ?? 'irrigation',
            note: String(d.note ?? ''),
            createdAt: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          });
        }
      });
      onLogs(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export async function persistFarmSettings(
  settings: FarmSettings,
  uid: string,
): Promise<void> {
  const path = 'farmSettings/estate';
  try {
    await setDoc(doc(db, 'farmSettings', 'estate'), {
      aquiferDailyCapM3: Math.max(5000, Math.min(120000, Math.round(settings.aquiferDailyCapM3))),
      evapLockoutTempC: Math.max(25, Math.min(55, Math.round(settings.evapLockoutTempC))),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listTeamUsersForManager(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data();
      users.push({
        uid: String(data.uid ?? d.id),
        email: String(data.email ?? ''),
        displayName: String(data.displayName ?? 'Member'),
        role: data.role === 'farm_manager' ? 'farm_manager' : 'field_operator',
        assignedPlotCount: typeof data.assignedPlotCount === 'number' ? data.assignedPlotCount : 4,
      });
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateMemberRoleByManager(
  targetUid: string,
  newRole: UserRole,
): Promise<void> {
  const path = `users/${targetUid}`;
  try {
    await updateDoc(doc(db, 'users', targetUid), {
      role: newRole,
      assignedPlotCount: newRole === 'farm_manager' ? 12 : 4,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
