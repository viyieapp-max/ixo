import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_FINANCE_STORAGE_KEY,
  LEGACY_MIGRATED_UID_KEY,
  getUserFinanceStorageKey,
  loadUserLocalFinanceState,
  resolveUserInitialFinanceState,
  saveUserLocalFinanceState,
  type StorageLike,
} from './userStorage';
import type { FinanceStoreState } from '../types/finance';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & {
  dump: () => Record<string, string>;
} {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

test('per-user storage isolates multiple Google users and preserves other users data', () => {
  const storage = createMemoryStorage({
    other_user_custom_store: '{"keep":"forever"}',
  });

  const userAState: FinanceStoreState = {
    brandName: 'HansStore',
    baseBalance: 500000,
    transactions: [
      {
        id: 'tx-a1',
        date: '2026-11-25',
        description: 'Penjualan A',
        category: 'Pemasukan Usaha',
        type: 'income',
        amount: 150000,
        createdAt: '2026-11-25T10:00:00Z',
        updatedAt: '2026-11-25T10:00:00Z',
      },
    ],
    balanceLogs: [],
  };

  const userBState: FinanceStoreState = {
    brandName: 'TokoB',
    baseBalance: 100000,
    transactions: [],
    balanceLogs: [],
  };

  saveUserLocalFinanceState('uid-A', userAState, storage);
  saveUserLocalFinanceState('uid-B', userBState, storage);

  assert.equal(
    loadUserLocalFinanceState('uid-A', storage)?.brandName,
    'HansStore'
  );
  assert.equal(
    loadUserLocalFinanceState('uid-A', storage)?.transactions.length,
    1
  );
  assert.equal(loadUserLocalFinanceState('uid-B', storage)?.brandName, 'TokoB');
  assert.equal(
    storage.getItem('other_user_custom_store'),
    '{"keep":"forever"}'
  );
  assert.ok(storage.getItem(getUserFinanceStorageKey('uid-A')));
  assert.ok(storage.getItem(getUserFinanceStorageKey('uid-B')));
});

test('legacy storage migrates safely for first user without deleting legacy key or leaking to second user', () => {
  const legacyState: FinanceStoreState = {
    brandName: 'WarungMaju',
    baseBalance: 250000,
    transactions: [
      {
        id: 'tx-legacy-1',
        date: '2026-11-20',
        description: 'Stok Barang',
        category: 'Perlengkapan',
        type: 'expense',
        amount: 50000,
        createdAt: '2026-11-20T09:00:00Z',
        updatedAt: '2026-11-20T09:00:00Z',
      },
    ],
    balanceLogs: [],
  };

  const storage = createMemoryStorage({
    [LEGACY_FINANCE_STORAGE_KEY]: JSON.stringify(legacyState),
    external_user_backup: 'preserved',
  });

  const resolvedA = resolveUserInitialFinanceState('uid-first', storage);
  assert.equal(resolvedA.brandName, 'WarungMaju');
  assert.equal(resolvedA.baseBalance, 250000);
  assert.equal(resolvedA.transactions.length, 1);

  // Legacy key & external storage remain intact (never deleted)
  assert.ok(storage.getItem(LEGACY_FINANCE_STORAGE_KEY));
  assert.equal(storage.getItem('external_user_backup'), 'preserved');
  assert.equal(storage.getItem(LEGACY_MIGRATED_UID_KEY), 'uid-first');

  // Second user starts clean without overwriting or inheriting uid-first's legacy data
  const resolvedB = resolveUserInitialFinanceState('uid-second', storage);
  assert.equal(resolvedB.brandName, 'KasBuku');
  assert.equal(resolvedB.baseBalance, 0);
  assert.equal(resolvedB.transactions.length, 0);
});
