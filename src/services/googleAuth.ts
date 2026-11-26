import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

const ACCOUNT_META_STORAGE_KEY = 'kasbuku_saved_account_v1';

export interface SavedAccountMeta {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

void setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore if browser environment restricts persistence changes
});

let isSigningIn = false;

export function getSavedAccountMeta(): SavedAccountMeta | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_META_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedAccountMeta>;
    if (typeof parsed.email === 'string' && parsed.email.trim()) {
      return {
        uid: parsed.uid ?? '',
        email: parsed.email,
        displayName: parsed.displayName ?? '',
        photoURL: parsed.photoURL ?? '',
      };
    }
  } catch {
    // Ignore invalid storage
  }
  return null;
}

function saveAccountMeta(meta: SavedAccountMeta): void {
  try {
    localStorage.setItem(ACCOUNT_META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore quota errors
  }
}

export function clearSavedAccountMeta(): void {
  try {
    localStorage.removeItem(ACCOUNT_META_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const initAuth = (
  onAuthStateUpdate?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const existing = getSavedAccountMeta();
      saveAccountMeta({
        uid: user.uid,
        email: user.email ?? existing?.email ?? '',
        displayName: user.displayName ?? existing?.displayName ?? '',
        photoURL: user.photoURL ?? existing?.photoURL ?? '',
      });
      if (!isSigningIn) {
        onAuthStateUpdate?.(user);
      }
    } else {
      clearSavedAccountMeta();
      onAuthStateUpdate?.(null);
    }
  });
};

export const googleSignIn = async (options?: {
  selectAccount?: boolean;
}): Promise<User | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    if (options?.selectAccount) {
      provider.setCustomParameters({ prompt: 'select_account' });
    }
    const result = await signInWithPopup(auth, provider);
    saveAccountMeta({
      uid: result.user.uid,
      email: result.user.email ?? '',
      displayName: result.user.displayName ?? '',
      photoURL: result.user.photoURL ?? '',
    });
    return result.user;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  await auth.signOut();
  clearSavedAccountMeta();
};
