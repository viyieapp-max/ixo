import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChartSeries,
  computeBaseBalanceForTarget,
  computeCurrentBalance,
  filterTransactionsByRange,
  formatIndonesianDate,
  formatRupiah,
  formatRupiahInputDisplay,
  getTodayISODate,
  parseRupiahInput,
  summarizeTransactions,
} from './finance';
import type { BalanceLog, Transaction } from '../types/finance';

test('formatRupiah formats positive, zero, and negative numbers in IDR style', () => {
  assert.equal(formatRupiah(10000), 'Rp10.000');
  assert.equal(formatRupiah(1500000), 'Rp1.500.000');
  assert.equal(formatRupiah(0), 'Rp0');
  assert.equal(formatRupiah(-25000), '-Rp25.000');
});

test('parseRupiahInput and formatRupiahInputDisplay handle raw and formatted input', () => {
  assert.equal(parseRupiahInput('10000'), 10000);
  assert.equal(parseRupiahInput('Rp10.000'), 10000);
  assert.equal(parseRupiahInput('abc25000xyz'), 25000);
  assert.equal(parseRupiahInput(''), 0);
  assert.equal(formatRupiahInputDisplay('10000'), 'Rp10.000');
  assert.equal(formatRupiahInputDisplay(''), '');
});

test('getTodayISODate and formatIndonesianDate return consistent local date strings', () => {
  const sampleDate = new Date(2026, 10, 25, 14, 30, 0); // 2026-11-25
  assert.equal(getTodayISODate(sampleDate), '2026-11-25');
  assert.equal(formatIndonesianDate('2026-11-25'), '25 Nov 2026');
});

test('filterTransactionsByRange filters 1w, 1m, 2m, 3m, 6m, 1y, and all accurately', () => {
  const ref = new Date(2026, 10, 25); // 2026-11-25
  const txs: Transaction[] = [
    {
      id: 't1',
      date: '2026-11-25',
      description: 'Hari ini',
      category: 'Operasional',
      type: 'expense',
      amount: 10000,
      createdAt: '2026-11-25T08:00:00Z',
      updatedAt: '2026-11-25T08:00:00Z',
    },
    {
      id: 't2',
      date: '2026-11-10',
      description: 'Dua minggu lalu',
      category: 'Operasional',
      type: 'expense',
      amount: 20000,
      createdAt: '2026-11-10T08:00:00Z',
      updatedAt: '2026-11-10T08:00:00Z',
    },
    {
      id: 't3',
      date: '2026-10-10',
      description: 'Sebulan lebih lalu',
      category: 'Operasional',
      type: 'income',
      amount: 50000,
      createdAt: '2026-10-10T08:00:00Z',
      updatedAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 't4',
      date: '2026-07-15',
      description: 'Empat bulan lalu',
      category: 'Operasional',
      type: 'expense',
      amount: 30000,
      createdAt: '2026-07-15T08:00:00Z',
      updatedAt: '2026-07-15T08:00:00Z',
    },
    {
      id: 't5',
      date: '2025-05-01',
      description: 'Lebih dari setahun lalu',
      category: 'Operasional',
      type: 'expense',
      amount: 40000,
      createdAt: '2025-05-01T08:00:00Z',
      updatedAt: '2025-05-01T08:00:00Z',
    },
  ];

  assert.deepEqual(
    filterTransactionsByRange(txs, '1w', ref).map((t) => t.id),
    ['t1']
  );
  assert.deepEqual(
    filterTransactionsByRange(txs, '1m', ref).map((t) => t.id),
    ['t1', 't2']
  );
  assert.deepEqual(
    filterTransactionsByRange(txs, '2m', ref).map((t) => t.id),
    ['t1', 't2', 't3']
  );
  assert.deepEqual(
    filterTransactionsByRange(txs, '6m', ref).map((t) => t.id),
    ['t1', 't2', 't3', 't4']
  );
  assert.deepEqual(
    filterTransactionsByRange(txs, '1y', ref).map((t) => t.id),
    ['t1', 't2', 't3', 't4']
  );
  assert.deepEqual(
    filterTransactionsByRange(txs, 'all', ref).map((t) => t.id),
    ['t1', 't2', 't3', 't4', 't5']
  );
});

test('balance calculations support Set Saldo, Add Saldo with logs, Edit Saldo, and transactions', () => {
  const txs: Transaction[] = [
    {
      id: '1',
      date: '2026-11-24',
      description: 'Penjualan Produk',
      category: 'Pemasukan Usaha',
      type: 'income',
      amount: 200000,
      createdAt: '2026-11-24T10:00:00Z',
      updatedAt: '2026-11-24T10:00:00Z',
    },
    {
      id: '2',
      date: '2026-11-25',
      description: 'Beli Tinta Printer',
      category: 'Perlengkapan',
      type: 'expense',
      amount: 50000,
      createdAt: '2026-11-25T10:00:00Z',
      updatedAt: '2026-11-25T10:00:00Z',
    },
  ];

  const logs: BalanceLog[] = [
    {
      id: 'b1',
      action: 'add',
      amount: 500000,
      previousBalance: 1000000,
      resultingBalance: 1500000,
      note: 'Tambahan kas harian',
      date: '2026-11-25',
      createdAt: '2026-11-25T09:00:00Z',
    },
  ];

  const target = 2000000;
  const base = computeBaseBalanceForTarget(target, logs, txs);
  assert.equal(computeCurrentBalance(base, logs, txs), 2000000);

  const summary = summarizeTransactions(txs);
  assert.equal(summary.totalIncome, 200000);
  assert.equal(summary.totalExpense, 50000);
  assert.equal(summary.netCashflow, 150000);

  const series = buildChartSeries(txs, '1m');
  assert.equal(series.length, 2);
  assert.equal(series[0].income, 200000);
  assert.equal(series[1].expense, 50000);
});
