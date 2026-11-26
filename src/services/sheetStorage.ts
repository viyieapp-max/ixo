import type {
  BalanceLog,
  FinanceStoreState,
  Transaction,
} from '../types/finance';
import { getTodayISODate } from '../utils/finance';

export const USER_SHEET_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzAdhjVGYV2EutIJcLcvstURFxBY80n22aIPrfa9Hdm7lmpXNzhhbv-Yv-NXk2bpw5kUw/exec';

export type SheetLoadResult =
  | { status: 'found'; data: FinanceStoreState }
  | { status: 'not_found' }
  | { status: 'error'; reason: 'script_not_ready' | 'network' | 'invalid_response'; message: string };

export type SheetSaveResult =
  | { status: 'saved' }
  | { status: 'error'; reason: 'script_not_ready' | 'network' | 'invalid_response'; message: string };

const pendingSaveQueueByUid = new Map<string, Promise<SheetSaveResult>>();

export function sanitizeBrandName(raw: unknown): string {
  if (typeof raw !== 'string') return 'KasBuku';
  const trimmed = raw.trim().slice(0, 32);
  return trimmed.length > 0 ? trimmed : 'KasBuku';
}

function normalizeTransactions(raw: unknown): Transaction[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  const result: Transaction[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const tx = item as Partial<Transaction>;
    const amount =
      typeof tx.amount === 'number' && Number.isFinite(tx.amount)
        ? Math.max(0, Math.round(tx.amount))
        : Number(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const createdAt =
      typeof tx.createdAt === 'string' && tx.createdAt.trim()
        ? tx.createdAt
        : new Date().toISOString();
    result.push({
      id:
        typeof tx.id === 'string' && tx.id.trim()
          ? tx.id
          : `tx-${Date.now()}-${result.length}`,
      date:
        typeof tx.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(tx.date)
          ? tx.date
          : getTodayISODate(),
      description:
        typeof tx.description === 'string' && tx.description.trim()
          ? tx.description.trim().slice(0, 200)
          : 'Transaksi',
      category:
        typeof tx.category === 'string' && tx.category.trim()
          ? tx.category.trim().slice(0, 60)
          : 'Lainnya',
      type: tx.type === 'income' ? 'income' : 'expense',
      amount,
      createdAt,
      updatedAt:
        typeof tx.updatedAt === 'string' && tx.updatedAt.trim()
          ? tx.updatedAt
          : createdAt,
    });
  }

  result.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
  return result;
}

function normalizeBalanceLogs(raw: unknown): BalanceLog[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  const result: BalanceLog[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const log = item as Partial<BalanceLog>;
    const amount = Number(log.amount);
    const previousBalance = Number(log.previousBalance);
    const resultingBalance = Number(log.resultingBalance);
    if (
      !Number.isFinite(amount) ||
      !Number.isFinite(previousBalance) ||
      !Number.isFinite(resultingBalance)
    ) {
      continue;
    }

    result.push({
      id:
        typeof log.id === 'string' && log.id.trim()
          ? log.id
          : `bal-${Date.now()}-${result.length}`,
      action:
        log.action === 'set' || log.action === 'edit' ? log.action : 'add',
      amount: Math.max(0, Math.round(amount)),
      previousBalance: Math.round(previousBalance),
      resultingBalance: Math.round(resultingBalance),
      note: typeof log.note === 'string' ? log.note.slice(0, 200) : '',
      date:
        typeof log.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(log.date)
          ? log.date
          : getTodayISODate(),
      createdAt:
        typeof log.createdAt === 'string' && log.createdAt.trim()
          ? log.createdAt
          : new Date().toISOString(),
    });
  }

  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return result;
}

export function normalizeSheetFinanceData(raw: unknown): FinanceStoreState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const rawBase = Number(obj.baseBalance ?? 0);
  const baseBalance = Number.isFinite(rawBase) ? Math.round(rawBase) : 0;

  return {
    brandName: sanitizeBrandName(obj.brandName),
    baseBalance,
    transactions: normalizeTransactions(
      obj.transactions ?? obj.transactionsJson ?? []
    ),
    balanceLogs: normalizeBalanceLogs(
      obj.balanceLogs ?? obj.balanceLogsJson ?? []
    ),
  };
}

export function buildSaveSheetPayload(
  uid: string,
  email: string,
  state: FinanceStoreState
) {
  return {
    action: 'saveUserData',
    uid,
    email,
    data: {
      brandName: sanitizeBrandName(state.brandName),
      baseBalance: Number.isFinite(state.baseBalance)
        ? Math.round(state.baseBalance)
        : 0,
      transactions: state.transactions,
      balanceLogs: state.balanceLogs,
    },
  };
}

export function parseSheetResponseText(
  text: string
):
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: 'script_not_ready' | 'invalid_response'; message: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: 'invalid_response',
      message: 'Respons Google Apps Script kosong.',
    };
  }

  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('Script function not found')
  ) {
    const missingDoGet = trimmed.includes('Script function not found: doGet');
    const missingDoPost = trimmed.includes('Script function not found: doPost');
    const message =
      missingDoGet || missingDoPost
        ? 'Google Apps Script belum memiliki fungsi doGet/doPost yang di-deploy.'
        : 'Google Apps Script mengembalikan halaman HTML, bukan JSON.';
    return {
      ok: false,
      reason: 'script_not_ready',
      message,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {
        ok: false,
        reason: 'invalid_response',
        message: 'Format JSON dari Google Apps Script tidak valid.',
      };
    }
    return { ok: true, payload: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      reason: 'invalid_response',
      message: 'Gagal membaca respons JSON dari Google Apps Script.',
    };
  }
}

export async function loadUserFinanceFromSheet(
  uid: string,
  email: string,
  fetchFn: typeof fetch = fetch
): Promise<SheetLoadResult> {
  if (!uid) {
    return {
      status: 'error',
      reason: 'invalid_response',
      message: 'UID pengguna tidak tersedia.',
    };
  }

  const url = `${USER_SHEET_WEBAPP_URL}?action=getUserData&uid=${encodeURIComponent(
    uid
  )}&email=${encodeURIComponent(email)}`;

  try {
    const res = await fetchFn(url, {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    const parsed = parseSheetResponseText(text);
    if (!parsed.ok) {
      return {
        status: 'error',
        reason: parsed.reason,
        message: parsed.message,
      };
    }

    const payload = parsed.payload;
    if (payload.ok === false) {
      return {
        status: 'error',
        reason: 'invalid_response',
        message:
          typeof payload.error === 'string'
            ? payload.error
            : 'Gagal mengambil data dari Google Sheet.',
      };
    }

    if (payload.found === false || !payload.data) {
      return { status: 'not_found' };
    }

    const normalized = normalizeSheetFinanceData(payload.data);
    if (!normalized) {
      return { status: 'not_found' };
    }

    return { status: 'found', data: normalized };
  } catch (err) {
    return {
      status: 'error',
      reason: 'network',
      message:
        err instanceof Error
          ? err.message
          : 'Koneksi ke Google Apps Script gagal.',
    };
  }
}

async function postUserFinanceToSheet(
  uid: string,
  email: string,
  state: FinanceStoreState,
  fetchFn: typeof fetch = fetch
): Promise<SheetSaveResult> {
  try {
    const res = await fetchFn(USER_SHEET_WEBAPP_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(buildSaveSheetPayload(uid, email, state)),
    });
    const text = await res.text();
    const parsed = parseSheetResponseText(text);
    if (!parsed.ok) {
      return {
        status: 'error',
        reason: parsed.reason,
        message: parsed.message,
      };
    }
    if (parsed.payload.ok === false) {
      return {
        status: 'error',
        reason: 'invalid_response',
        message:
          typeof parsed.payload.error === 'string'
            ? parsed.payload.error
            : 'Gagal menyimpan data ke Google Sheet.',
      };
    }
    return { status: 'saved' };
  } catch (err) {
    return {
      status: 'error',
      reason: 'network',
      message:
        err instanceof Error
          ? err.message
          : 'Koneksi ke Google Apps Script gagal.',
    };
  }
}

/**
 * Queues per-user saves sequentially so rapid edits always arrive in order
 * and never overwrite other users' rows in Google Sheets.
 */
export function saveUserFinanceToSheet(
  uid: string,
  email: string,
  state: FinanceStoreState,
  fetchFn: typeof fetch = fetch
): Promise<SheetSaveResult> {
  if (!uid) {
    return Promise.resolve({
      status: 'error',
      reason: 'invalid_response',
      message: 'UID pengguna tidak tersedia.',
    });
  }

  const prev =
    pendingSaveQueueByUid.get(uid) ??
    Promise.resolve<SheetSaveResult>({ status: 'saved' });

  const next = prev
    .catch(() => ({ status: 'saved' as const }))
    .then(() => postUserFinanceToSheet(uid, email, state, fetchFn));

  pendingSaveQueueByUid.set(uid, next);
  void next.finally(() => {
    if (pendingSaveQueueByUid.get(uid) === next) {
      pendingSaveQueueByUid.delete(uid);
    }
  });

  return next;
}
