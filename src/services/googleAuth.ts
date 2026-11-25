import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  setPersistence,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

const ACCOUNT_META_STORAGE_KEY = 'kasbuku_saved_account_v1';

export interface SavedAccountMeta {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  sheetsAuthorized: boolean;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

void setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore if browser environment restricts persistence changes
});

// Strict in-memory cache ONLY for the OAuth access token (never persisted to storage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

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
        sheetsAuthorized: Boolean(parsed.sheetsAuthorized),
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

function clearSavedAccountMeta(): void {
  try {
    localStorage.removeItem(ACCOUNT_META_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function markSheetsConsentRevoked(): void {
  cachedAccessToken = null;
  const existing = getSavedAccountMeta();
  if (existing) {
    saveAccountMeta({ ...existing, sheetsAuthorized: false });
  }
}

function buildProvider(options: {
  mode: 'resume' | 'consent' | 'select_account';
  loginHint?: string;
}): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  for (const scope of GOOGLE_SHEETS_SCOPES) {
    provider.addScope(scope);
  }

  const customParams: Record<string, string> = {
    include_granted_scopes: 'true',
  };

  if (options.loginHint) {
    customParams.login_hint = options.loginHint;
  }

  if (options.mode === 'select_account') {
    customParams.prompt = 'consent select_account';
  } else if (options.mode === 'consent') {
    customParams.prompt = 'consent';
  }
  // For 'resume', omit `prompt` so Google skips account picker & consent when already granted

  provider.setCustomParameters(customParams);
  return provider;
}

export async function verifySheetsScope(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(
        accessToken
      )}`
    );
    if (!res.ok) return true; // If tokeninfo fails due to network, let API call decide
    const info = (await res.json()) as { scope?: string };
    const scopes = (info.scope ?? '').split(/\s+/);
    return scopes.includes('https://www.googleapis.com/auth/spreadsheets');
  } catch {
    return true;
  }
}

export const initAuth = (
  onAuthStateUpdate?: (user: User | null, token: string | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const existing = getSavedAccountMeta();
      saveAccountMeta({
        uid: user.uid,
        email: user.email ?? existing?.email ?? '',
        displayName: user.displayName ?? existing?.displayName ?? '',
        photoURL: user.photoURL ?? existing?.photoURL ?? '',
        sheetsAuthorized: existing?.sheetsAuthorized ?? false,
      });
      if (!isSigningIn) {
        onAuthStateUpdate?.(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      onAuthStateUpdate?.(null, null);
    }
  });
};

export const googleSignIn = async (options?: {
  mode?: 'auto' | 'resume' | 'consent' | 'select_account';
  loginHint?: string;
}): Promise<{
  user: User;
  accessToken: string;
  hasSheetsAccess: boolean;
} | null> => {
  try {
    isSigningIn = true;
    const currentUser = auth.currentUser;
    const saved = getSavedAccountMeta();
    const hint = options?.loginHint ?? currentUser?.email ?? saved?.email ?? undefined;

    let resolvedMode: 'resume' | 'consent' | 'select_account' = 'select_account';
    if (options?.mode && options.mode !== 'auto') {
      resolvedMode = options.mode;
    } else if (currentUser && saved?.sheetsAuthorized) {
      resolvedMode = 'resume';
    } else if (currentUser) {
      resolvedMode = 'consent';
    } else if (saved?.sheetsAuthorized && hint) {
      resolvedMode = 'resume';
    }

    const provider = buildProvider({
      mode: resolvedMode,
      loginHint: resolvedMode === 'select_account' ? undefined : hint,
    });

    const result =
      currentUser && resolvedMode !== 'select_account'
        ? await reauthenticateWithPopup(currentUser, provider)
        : await signInWithPopup(auth, provider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Sheets.');
    }

    const hasSheetsAccess = await verifySheetsScope(credential.accessToken);
    saveAccountMeta({
      uid: result.user.uid,
      email: result.user.email ?? '',
      displayName: result.user.displayName ?? '',
      photoURL: result.user.photoURL ?? '',
      sheetsAuthorized: hasSheetsAccess,
    });

    if (!hasSheetsAccess) {
      cachedAccessToken = null;
      return {
        user: result.user,
        accessToken: credential.accessToken,
        hasSheetsAccess: false,
      };
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
      hasSheetsAccess: true,
    };
  } finally {
    isSigningIn = false;
  }
};

export const ensureSheetsAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const saved = getSavedAccountMeta();
  const hint = auth.currentUser?.email ?? saved?.email;
  if (!auth.currentUser && !hint) return null;

  const res = await googleSignIn({
    mode: 'auto',
    loginHint: hint,
  });

  if (res && !res.hasSheetsAccess) {
    throw new Error(
      'Izin Google Sheets belum dicentang pada layar persetujuan Google. Klik "Berikan Izin Google Sheets" lalu centang akses Google Sheets.'
    );
  }
  return res?.accessToken ?? null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  clearSavedAccountMeta();
};
