import type {
  BalanceLog,
  ChartBucket,
  TimeRangeKey,
  Transaction,
} from '../types/finance';

export const TIME_RANGE_OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: '1w', label: '1 Minggu' },
  { key: '1m', label: '1 Bulan' },
  { key: '2m', label: '2 Bulan' },
  { key: '3m', label: '3 Bulan' },
  { key: '6m', label: '6 Bulan' },
  { key: '1y', label: '1 Tahun' },
  { key: 'all', label: 'All' },
];

export const DEFAULT_CATEGORIES = [
  'Operasional',
  'Perlengkapan',
  'Transportasi',
  'Konsumsi',
  'Tagihan & Utilitas',
  'Pemasukan Usaha',
  'Lainnya',
];

/**
 * Formats an integer/number into Indonesian Rupiah format without decimals:
 * e.g. 10000 -> "Rp10.000", -10000 -> "-Rp10.000", 0 -> "Rp0"
 */
export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  const isNegative = safeAmount < 0;
  const absFormatted = Math.abs(safeAmount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}Rp${absFormatted}`;
}

/**
 * Parses raw user typing into a clean non-negative integer in IDR.
 * e.g. "10000" -> 10000, "Rp10.000" -> 10000, "abc25000" -> 25000
 */
export function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 999_999_999_999_999);
}

/**
 * Formats raw input live for controlled currency input field.
 * Empty string stays empty so user can clear input easily.
 */
export function formatRupiahInputDisplay(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  const num = parseRupiahInput(digits);
  return formatRupiah(num);
}

/**
 * Returns local calendar date as YYYY-MM-DD.
 */
export function getTodayISODate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const SHORT_MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatIndonesianDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = SHORT_MONTHS_ID[monthIdx] ?? match[2];
  return `${day} ${monthName} ${year}`;
}

/**
 * Computes the start ISO date (inclusive) for a given time range relative to referenceDate.
 */
export function getRangeStartDate(
  range: TimeRangeKey,
  referenceDate: Date = new Date()
): string | null {
  if (range === 'all') return null;

  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  switch (range) {
    case '1w':
      start.setDate(start.getDate() - 6);
      break;
    case '1m':
      start.setMonth(start.getMonth() - 1);
      break;
    case '2m':
      start.setMonth(start.getMonth() - 2);
      break;
    case '3m':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6m':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return getTodayISODate(start);
}

export function filterTransactionsByRange(
  transactions: Transaction[],
  range: TimeRangeKey,
  referenceDate: Date = new Date()
): Transaction[] {
  const startIso = getRangeStartDate(range, referenceDate);
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });

  if (!startIso) return sorted;
  return sorted.filter((tx) => tx.date >= startIso);
}

export function summarizeTransactions(transactions: Transaction[]): {
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  count: number;
  expenseCount: number;
  incomeCount: number;
} {
  let totalExpense = 0;
  let totalIncome = 0;
  let expenseCount = 0;
  let incomeCount = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      totalExpense += tx.amount;
      expenseCount += 1;
    } else {
      totalIncome += tx.amount;
      incomeCount += 1;
    }
  }

  return {
    totalExpense,
    totalIncome,
    netCashflow: totalIncome - totalExpense,
    count: transactions.length,
    expenseCount,
    incomeCount,
  };
}

/**
 * Current Saldo = baseBalance + sum(addLogs) + sum(income) - sum(expense).
 */
export function computeCurrentBalance(
  baseBalance: number,
  balanceLogs: BalanceLog[],
  transactions: Transaction[]
): number {
  const totalAdd = balanceLogs
    .filter((log) => log.action === 'add')
    .reduce((sum, log) => sum + log.amount, 0);
  const { totalIncome, totalExpense } = summarizeTransactions(transactions);
  return baseBalance + totalAdd + totalIncome - totalExpense;
}

/**
 * Calculates the new baseBalance needed so that current balance equals targetBalance.
 */
export function computeBaseBalanceForTarget(
  targetBalance: number,
  balanceLogs: BalanceLog[],
  transactions: Transaction[]
): number {
  const totalAdd = balanceLogs
    .filter((log) => log.action === 'add')
    .reduce((sum, log) => sum + log.amount, 0);
  const { totalIncome, totalExpense } = summarizeTransactions(transactions);
  return targetBalance - (totalAdd + totalIncome - totalExpense);
}

/**
 * Aggregates transactions into chronological chart buckets:
 * - For '1w' or '1m': daily buckets (DD Mon)
 * - For '2m', '3m', '6m', '1y', 'all': monthly buckets (Mon YY)
 */
export function buildChartSeries(
  transactions: Transaction[],
  range: TimeRangeKey
): ChartBucket[] {
  if (transactions.length === 0) return [];

  const useDaily = range === '1w' || range === '1m';
  const buckets = new Map<string, ChartBucket>();

  const chronological = [...transactions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  for (const tx of chronological) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tx.date);
    if (!match) continue;
    const year = match[1];
    const monthNum = Number(match[2]);
    const dayNum = Number(match[3]);
    const monthLabel = SHORT_MONTHS_ID[monthNum - 1] ?? match[2];

    const key = useDaily ? tx.date : `${year}-${match[2]}`;
    const label = useDaily
      ? `${dayNum} ${monthLabel}`
      : `${monthLabel} ${year.slice(2)}`;

    const existing = buckets.get(key) ?? {
      key,
      label,
      income: 0,
      expense: 0,
      net: 0,
    };

    if (tx.type === 'income') {
      existing.income += tx.amount;
    } else {
      existing.expense += tx.amount;
    }
    existing.net = existing.income - existing.expense;
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
}
