export type TransactionType = 'expense' | 'income';

export type TimeRangeKey = '1w' | '1m' | '2m' | '3m' | '6m' | '1y' | 'all';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string; // Keperluan (freeform text)
  category: string;
  type: TransactionType;
  amount: number; // Always positive integer in IDR
  createdAt: string;
  updatedAt: string;
}

export type BalanceActionType = 'set' | 'add' | 'edit';

export interface BalanceLog {
  id: string;
  action: BalanceActionType;
  amount: number; // Delta for 'add', target balance for 'set' or 'edit'
  previousBalance: number;
  resultingBalance: number;
  note: string; // Keterangan dari user
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface FinanceStoreState {
  brandName: string;
  baseBalance: number;
  transactions: Transaction[];
  balanceLogs: BalanceLog[];
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetTabName: string;
  lastSyncedAt: string | null;
}

export interface ChartBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}
