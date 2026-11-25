import type { FinanceStoreState } from '../types/finance';

export function createInitialFinanceState(): FinanceStoreState {
  return {
    brandName: 'KasBuku',
    baseBalance: 0,
    transactions: [],
    balanceLogs: [],
    spreadsheetId: '',
    spreadsheetTitle: '',
    sheetTabName: 'Transaksi',
    lastSyncedAt: null,
  };
}
