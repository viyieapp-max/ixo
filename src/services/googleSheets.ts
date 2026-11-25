import type { BalanceLog, Transaction } from '../types/finance';
import { formatRupiah, parseRupiahInput } from '../utils/finance';

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: string[];
}

export function parseSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const urlMatch = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(trimmed);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed;
}

export class InsufficientScopeError extends Error {
  constructor(message = 'Izin akses Google Sheets belum diberikan.') {
    super(message);
    this.name = 'InsufficientScopeError';
  }
}

async function sheetsFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Google Sheets error (${res.status})`;
    let isInsufficientScope = false;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) {
        message = errJson.error.message;
      }
      const details = JSON.stringify(errJson ?? '').toLowerCase();
      if (
        res.status === 403 &&
        (details.includes('insufficient') ||
          details.includes('scope') ||
          details.includes('access_token_scope_insufficient'))
      ) {
        isInsufficientScope = true;
      }
    } catch {
      // ignore json parse failure
    }
    if (isInsufficientScope) {
      throw new InsufficientScopeError(
        'Izin akses Google Sheets belum aktif pada sesi login ini. Silakan login ulang dan centang izin Google Sheets pada pop-up Google.'
      );
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function fetchSpreadsheetMeta(
  accessToken: string,
  spreadsheetIdOrUrl: string
): Promise<SpreadsheetMetadata> {
  const spreadsheetId = parseSpreadsheetId(spreadsheetIdOrUrl);
  if (!spreadsheetId) {
    throw new Error('ID atau URL Google Sheet tidak valid.');
  }

  const data = await sheetsFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{ properties: { title: string } }>;
  }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties.title`,
    accessToken
  );

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Spreadsheet Keuangan',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets: (data.sheets ?? []).map((s) => s.properties.title),
  };
}

export async function createFinanceSpreadsheet(
  accessToken: string,
  title: string
): Promise<SpreadsheetMetadata> {
  const cleanTitle = title.trim() || 'KasBuku Pembukuan Keuangan';
  const created = await sheetsFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{ properties: { title: string } }>;
  }>('https://sheets.googleapis.com/v4/spreadsheets', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: cleanTitle },
      sheets: [
        { properties: { title: 'Transaksi' } },
        { properties: { title: 'RingkasanSaldo' } },
      ],
    }),
  });

  // Initialize header row in Transaksi and RingkasanSaldo
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values/Transaksi!A1:G1?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [
          [
            'ID',
            'Tanggal',
            'Keperluan',
            'Kategori',
            'Jenis',
            'Nominal (Rp)',
            'Terakhir Diubah',
          ],
        ],
      }),
    }
  );

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values/RingkasanSaldo!A1:F1?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [
          ['Tanggal', 'Aksi', 'Keterangan', 'Nominal', 'Saldo Sebelum', 'Saldo Akhir'],
        ],
      }),
    }
  );

  return {
    spreadsheetId: created.spreadsheetId,
    title: created.properties.title,
    spreadsheetUrl: created.spreadsheetUrl,
    sheets: (created.sheets ?? []).map((s) => s.properties.title),
  };
}

function normalizeSheetDate(raw: string): string {
  const trimmed = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function readTransactionsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string
): Promise<Transaction[]> {
  const encodedRange = encodeURIComponent(`${tabName}!A2:G1000`);
  const data = await sheetsFetch<{ values?: string[][] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodedRange}`,
    accessToken
  );

  const rows = data.values ?? [];
  const results: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    // Support both structured 7-col format and simple 4-col format
    const hasIdCol = row.length >= 6;
    const rawId = hasIdCol ? row[0] : `sheet-${i + 2}`;
    const rawDate = hasIdCol ? row[1] : row[0];
    const rawDesc = hasIdCol ? row[2] : row[1];
    const rawCategory = hasIdCol ? row[3] : 'Lainnya';
    const rawType = hasIdCol ? row[4] : row[2];
    const rawAmount = hasIdCol ? row[5] : row[3];
    const rawUpdated = hasIdCol ? row[6] : new Date().toISOString();

    if (!rawDesc && !rawAmount) continue;
    const amount = parseRupiahInput(String(rawAmount ?? '0'));
    if (amount <= 0) continue;

    const normalizedType = String(rawType ?? '').toLowerCase();
    const type: 'income' | 'expense' =
      normalizedType.includes('masuk') || normalizedType.includes('income')
        ? 'income'
        : 'expense';

    const nowIso = new Date().toISOString();
    results.push({
      id: rawId || `sheet-${Date.now()}-${i}`,
      date: normalizeSheetDate(String(rawDate ?? '')),
      description: String(rawDesc ?? 'Transaksi').trim(),
      category: String(rawCategory || 'Operasional').trim(),
      type,
      amount,
      createdAt: rawUpdated || nowIso,
      updatedAt: rawUpdated || nowIso,
    });
  }

  return results;
}

export async function writeTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  transactions: Transaction[],
  balanceLogs: BalanceLog[],
  currentBalance: number,
  availableTabs: string[]
): Promise<void> {
  // Clear existing range first so deleted/edited rows don't leave stale rows
  const clearRange = encodeURIComponent(`${tabName}!A1:G2000`);
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${clearRange}:clear`,
    accessToken,
    { method: 'POST' }
  );

  const rows: (string | number)[][] = [
    [
      'ID',
      'Tanggal',
      'Keperluan',
      'Kategori',
      'Jenis',
      'Nominal (Rp)',
      'Terakhir Diubah',
    ],
    ...transactions.map((tx) => [
      tx.id,
      tx.date,
      tx.description,
      tx.category,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      formatRupiah(tx.amount),
      tx.updatedAt,
    ]),
  ];

  const writeRange = encodeURIComponent(`${tabName}!A1:G${rows.length}`);
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${writeRange}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ values: rows }),
    }
  );

  // If RingkasanSaldo tab exists, sync balance history + current balance too
  if (availableTabs.includes('RingkasanSaldo')) {
    const clearSaldoRange = encodeURIComponent('RingkasanSaldo!A1:F1000');
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${clearSaldoRange}:clear`,
      accessToken,
      { method: 'POST' }
    );

    const saldoRows: (string | number)[][] = [
      ['Saldo Saat Ini', formatRupiah(currentBalance), '', '', '', ''],
      ['Tanggal', 'Aksi', 'Keterangan', 'Nominal', 'Saldo Sebelum', 'Saldo Akhir'],
      ...balanceLogs.map((log) => [
        log.date,
        log.action === 'set'
          ? 'Set Saldo'
          : log.action === 'add'
            ? 'Add Saldo'
            : 'Edit Saldo',
        log.note || '-',
        formatRupiah(log.amount),
        formatRupiah(log.previousBalance),
        formatRupiah(log.resultingBalance),
      ]),
    ];

    const saldoWriteRange = encodeURIComponent(
      `RingkasanSaldo!A1:F${saldoRows.length}`
    );
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${saldoWriteRange}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: saldoRows }),
      }
    );
  }
}
