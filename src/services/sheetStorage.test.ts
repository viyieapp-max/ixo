import test from 'node:test';
import assert from 'node:assert/strict';
import {
  USER_SHEET_WEBAPP_URL,
  buildSaveSheetPayload,
  loadUserFinanceFromSheet,
  normalizeSheetFinanceData,
  parseSheetResponseText,
  saveUserFinanceToSheet,
} from './sheetStorage';
import type { FinanceStoreState } from '../types/finance';

test('parseSheetResponseText detects missing doGet/doPost HTML and valid JSON', () => {
  const htmlErr =
    '<!DOCTYPE html><html><head><title>Error</title></head><body>Script function not found: doPost</body></html>';
  const parsedErr = parseSheetResponseText(htmlErr);
  assert.equal(parsedErr.ok, false);
  if (!parsedErr.ok) {
    assert.equal(parsedErr.reason, 'script_not_ready');
  }

  const jsonOk = parseSheetResponseText(
    JSON.stringify({ ok: true, found: true, data: { brandName: 'HansStore' } })
  );
  assert.equal(jsonOk.ok, true);
});

test('normalizeSheetFinanceData parses stringified sheet cells and preserves records', () => {
  const normalized = normalizeSheetFinanceData({
    brandName: 'HansStore',
    baseBalance: '250000',
    transactionsJson: JSON.stringify([
      {
        id: 'tx-1',
        date: '2026-11-25',
        description: 'Penjualan',
        category: 'Pemasukan Usaha',
        type: 'income',
        amount: 100000,
      },
    ]),
    balanceLogsJson: JSON.stringify([
      {
        id: 'bal-1',
        action: 'add',
        amount: 50000,
        previousBalance: 200000,
        resultingBalance: 250000,
        note: 'Topup',
        date: '2026-11-25',
      },
    ]),
  });

  assert.ok(normalized);
  assert.equal(normalized.brandName, 'HansStore');
  assert.equal(normalized.baseBalance, 250000);
  assert.equal(normalized.transactions.length, 1);
  assert.equal(normalized.transactions[0].amount, 100000);
  assert.equal(normalized.balanceLogs.length, 1);
  assert.equal(normalized.balanceLogs[0].note, 'Topup');
});

test('loadUserFinanceFromSheet and saveUserFinanceToSheet target configured Apps Script URL cleanly', async () => {
  const calls: Array<{ url: string; method: string; body?: string }> = [];

  const fakeFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ url, method, body });

    if (method === 'GET') {
      return new Response(
        JSON.stringify({
          ok: true,
          found: true,
          data: {
            brandName: 'TokoA',
            baseBalance: 300000,
            transactions: [],
            balanceLogs: [],
          },
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const loaded = await loadUserFinanceFromSheet(
    'uid-123',
    'user@example.com',
    fakeFetch
  );
  assert.equal(loaded.status, 'found');
  if (loaded.status === 'found') {
    assert.equal(loaded.data.brandName, 'TokoA');
    assert.equal(loaded.data.baseBalance, 300000);
  }
  assert.ok(calls[0].url.startsWith(USER_SHEET_WEBAPP_URL));
  assert.ok(calls[0].url.includes('uid=uid-123'));

  const state: FinanceStoreState = {
    brandName: 'TokoA',
    baseBalance: 300000,
    transactions: [],
    balanceLogs: [],
  };
  const saved = await saveUserFinanceToSheet(
    'uid-123',
    'user@example.com',
    state,
    fakeFetch
  );
  assert.equal(saved.status, 'saved');
  assert.equal(calls[1].method, 'POST');
  assert.deepEqual(
    JSON.parse(calls[1].body || '{}'),
    buildSaveSheetPayload('uid-123', 'user@example.com', state)
  );
});
