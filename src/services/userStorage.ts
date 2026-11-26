import { createInitialFinanceState } from '../data/seedData';
import type { FinanceStoreState } from '../types/finance';

export const USER_FINANCE_STORAGE_PREFIX = 'kasbuku_user_finance_';
export const LEGACY_FINANCE_STORAGE_KEY = 'kasbuku_finance_state_v2';
export const LEGACY_MIGRATED_UID_KEY = 'kasbuku_legacy_migrated_uid_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export function getUserFinanceStorageKey(uid: string): string {
  return `${USER_FINANCE_STORAGE_PREFIX}${uid}`;
}

export function parseFinanceStoreState(raw: string | null): FinanceStoreState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FinanceStoreState>;
    if (
      typeof parsed.baseBalance === 'number' &&
      Number.isFinite(parsed.baseBalance) &&
      Array.isArray(parsed.transactions) &&
      Array.isArray(parsed.balanceLogs)
    ) {
      return {
        brandName:
          typeof parsed.brandName === 'string' && parsed.brandName.trim()
            ? parsed.brandName.trim()
            : 'KasBuku',
        baseBalance: parsed.baseBalance,
        transactions: parsed.transactions,
        balanceLogs: parsed.balanceLogs,
      };
    }
  } catch {
    // Ignore malformed JSON
  }
  return null;
}

export function hasMeaningfulFinanceData(state: FinanceStoreState): boolean {
  return (
    state.baseBalance !== 0 ||
    state.transactions.length > 0 ||
    state.balanceLogs.length > 0 ||
    (state.brandName.trim() !== '' && state.brandName.trim() !== 'KasBuku')
  );
}

/**
 * Loads cached financial data strictly scoped to the given user UID.
 * Never deletes or overwrites other users' localStorage keys.
 */
export function loadUserLocalFinanceState(
  uid: string,
  storage: StorageLike | null = getBrowserStorage()
): FinanceStoreState | null {
  if (!uid || !storage) return null;
  try {
    return parseFinanceStoreState(
      storage.getItem(getUserFinanceStorageKey(uid))
    );
  } catch {
    return null;
  }
}

/**
 * Saves cached financial data strictly scoped to the given user UID.
 */
export function saveUserLocalFinanceState(
  uid: string,
  state: FinanceStoreState,
  storage: StorageLike | null = getBrowserStorage()
): void {
  if (!uid || !storage) return;
  try {
    storage.setItem(getUserFinanceStorageKey(uid), JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Resolves initial financial state for a signed-in user without deleting any
 * existing user storage keys (including legacy keys or other users' accounts).
 */
export function resolveUserInitialFinanceState(
  uid: string,
  storage: StorageLike | null = getBrowserStorage()
): FinanceStoreState {
  if (!uid || !storage) return createInitialFinanceState();

  const perUserCached = loadUserLocalFinanceState(uid, storage);
  if (perUserCached) {
    return perUserCached;
  }

  try {
    const claimedByUid = storage.getItem(LEGACY_MIGRATED_UID_KEY);
    if (!claimedByUid || claimedByUid === uid) {
      const legacyState = parseFinanceStoreState(
        storage.getItem(LEGACY_FINANCE_STORAGE_KEY)
      );
      if (legacyState && hasMeaningfulFinanceData(legacyState)) {
        storage.setItem(LEGACY_MIGRATED_UID_KEY, uid);
        saveUserLocalFinanceState(uid, legacyState, storage);
        return legacyState;
      }
    }
  } catch {
    // Ignore storage restrictions
  }

  return createInitialFinanceState();
}
