import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  BalanceLog,
  TimeRangeKey,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  TIME_RANGE_OPTIONS,
  formatIndonesianDate,
  formatRupiah,
  formatRupiahInputDisplay,
  getTodayISODate,
  parseRupiahInput,
} from '../utils/finance';

export type LedgerTabKey = 'all' | 'expense' | 'income' | 'saldo';

interface LedgerSheetProps {
  transactions: Transaction[];
  balanceLogs: BalanceLog[];
  activeRange: TimeRangeKey;
  rangeLabel: string;
  searchQuery: string;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  currentBalance: number;
  isLocked: boolean;
  onRangeChange: (range: TimeRangeKey) => void;
  onSearchChange: (q: string) => void;
  onAddQuickTransaction: (payload: {
    date: string;
    description: string;
    category: string;
    type: TransactionType;
    amount: number;
  }) => void;
  onEditTransaction: (tx: Transaction) => void;
  onRequestDeleteTransaction: (tx: Transaction) => void;
  onEditBalanceLog: (log: BalanceLog) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenAccount?: () => void;
}

export function LedgerSheet({
  transactions,
  balanceLogs,
  activeRange,
  rangeLabel,
  searchQuery,
  totalExpense,
  totalIncome,
  netCashflow,
  currentBalance,
  isLocked,
  onRangeChange,
  onSearchChange,
  onAddQuickTransaction,
  onEditTransaction,
  onRequestDeleteTransaction,
  onEditBalanceLog,
  onExportExcel,
  onExportPDF,
  onOpenAccount,
}: LedgerSheetProps) {
  const [activeTab, setActiveTab] = useState<LedgerTabKey>('all');
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Quick-add row state (auto-defaults date to today)
  const [quickDate, setQuickDate] = useState(() => getTodayISODate());
  const [quickDesc, setQuickDesc] = useState('');
  const [quickCategory, setQuickCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [quickType, setQuickType] = useState<TransactionType>('expense');
  const [quickAmountRaw, setQuickAmountRaw] = useState('');
  const [quickError, setQuickError] = useState('');

  const visibleTransactions = transactions.filter((tx) => {
    if (activeTab === 'expense' && tx.type !== 'expense') return false;
    if (activeTab === 'income' && tx.type !== 'income') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.date.includes(q)
      );
    }
    return true;
  });

  const handleOpenQuickCreate = () => {
    if (isLocked) return;
    setQuickDate(getTodayISODate());
    setQuickError('');
    setShowQuickCreate((prev) => !prev);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const parsedAmount = parseRupiahInput(quickAmountRaw);
    if (!quickDesc.trim()) {
      setQuickError('Tulis keperluan transaksi terlebih dahulu.');
      return;
    }
    if (parsedAmount <= 0) {
      setQuickError('Masukkan nominal lebih dari Rp0.');
      return;
    }

    onAddQuickTransaction({
      date: quickDate || getTodayISODate(),
      description: quickDesc.trim(),
      category: quickCategory,
      type: quickType,
      amount: parsedAmount,
    });

    setQuickDesc('');
    setQuickAmountRaw('');
    setQuickDate(getTodayISODate());
    setQuickError('');
    setShowQuickCreate(false);
  };

  return (
    <section
      id="tabel-transaksi"
      aria-label="Tabel Keuangan & Riwayat Saldo"
      className="scroll-mt-4 md:scroll-mt-8 max-w-[1380px] mx-auto px-4 sm:px-8 pt-5 sm:pt-7 pb-10 sm:pb-14"
    >
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#EFF8FF]">
          Tabel Keuangan
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#EFF8FF]/65">
          Catat, filter, ubah, dan ekspor seluruh pemasukan, pengeluaran, serta riwayat saldo ke PDF atau Excel.
        </p>
      </div>

      {/* Filter Toolbar above Light Ice-White Sheet */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        {/* Time range segmented controls */}
        <div
          role="group"
          aria-label="Filter rentang waktu"
          className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#150A0B] border border-[#EFF8FF]/[0.08]"
        >
          {TIME_RANGE_OPTIONS.map((opt) => {
            const active = activeRange === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={isLocked}
                onClick={() => onRangeChange(opt.key)}
                aria-pressed={active}
                className={`px-3 sm:px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#BBEF1F] text-[#0D0303] shadow-sm'
                    : 'text-[#EFF8FF]/60 hover:text-[#EFF8FF] hover:bg-[#EFF8FF]/[0.05]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search + Export PDF / Excel */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 text-[#EFF8FF]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              disabled={isLocked}
              aria-label="Cari keperluan transaksi"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari keperluan atau kategori..."
              className="w-full min-h-[42px] rounded-xl bg-[#150A0B] border border-[#EFF8FF]/12 pl-10 pr-3.5 py-2.5 text-xs text-[#EFF8FF] placeholder:text-[#EFF8FF]/40 focus:outline-none focus:border-[#BBEF1F] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
            <button
              type="button"
              disabled={isLocked}
              onClick={onExportPDF}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#150A0B] hover:bg-[#1E1012] border border-[#EFF8FF]/12 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#EFF8FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#FF0055]" aria-hidden="true" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={onExportExcel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#150A0B] hover:bg-[#1E1012] border border-[#EFF8FF]/12 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#EFF8FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet
                className="w-3.5 h-3.5 text-[#BBEF1F]"
                aria-hidden="true"
              />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Crisp #EFF8FF Ice-White Sheet Container */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl sm:rounded-[28px] bg-[#EFF8FF] text-[#0D0303] shadow-xl overflow-hidden border border-[#EFF8FF]/80"
      >
        {/* Sheet Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-[#0D0303]/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <h2 className="font-display text-lg font-bold text-[#0D0303]">
              Buku Transaksi
            </h2>

            {/* View Sub-tabs */}
            <div
              role="tablist"
              aria-label="Filter jenis tampilan tabel"
              className="grid grid-cols-2 sm:flex sm:items-center gap-1 p-1 rounded-xl bg-[#0D0303]/[0.06] w-full sm:w-auto"
            >
              {(
                [
                  { id: 'all', label: 'Semua Data' },
                  { id: 'expense', label: 'Pengeluaran' },
                  { id: 'income', label: 'Pemasukan' },
                  { id: 'saldo', label: 'Riwayat Saldo' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    disabled={isLocked}
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-3.5 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[36px] rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap text-center ${
                      active
                        ? 'bg-[#0D0303] text-[#EFF8FF] shadow-xs'
                        : 'text-[#0D0303]/70 hover:text-[#0D0303]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab !== 'saldo' && (
            <button
              type="button"
              disabled={isLocked}
              onClick={handleOpenQuickCreate}
              aria-expanded={showQuickCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] w-full md:w-auto rounded-xl bg-[#BBEF1F] hover:bg-[#AEE018] disabled:opacity-45 disabled:cursor-not-allowed text-[#0D0303] text-xs font-bold transition-transform duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span>{showQuickCreate ? 'Tutup Form Cepat' : 'Buat Baris Baru'}</span>
            </button>
          )}
        </div>

        {/* Inline Quick-Create Table Row Form */}
        {!isLocked && showQuickCreate && activeTab !== 'saldo' && (
          <form
            onSubmit={handleQuickSubmit}
            className="px-4 sm:px-8 py-4 sm:py-5 bg-[#E3F1FC] border-b border-[#0D0303]/10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-3">
              <div className="text-xs font-bold text-[#0D0303]">
                Tambah Entri Baru (Tanggal otomatis hari ini)
              </div>
              <div className="text-xs text-[#0D0303]/70">
                Ketik angka seperti <span className="font-mono-nums font-semibold">10000</span> akan otomatis menjadi{' '}
                <span className="font-mono-nums font-semibold text-[#0D0303]">Rp10.000</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-2">
                <label
                  htmlFor="quick-date"
                  className="block text-[11px] font-semibold text-[#0D0303]/75 mb-1"
                >
                  Tanggal
                </label>
                <input
                  id="quick-date"
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-white border border-[#0D0303]/20 px-3 py-2 text-xs font-mono-nums text-[#0D0303] focus:outline-none focus:border-[#0D0303]"
                />
              </div>

              <div className="lg:col-span-4">
                <label
                  htmlFor="quick-desc"
                  className="block text-[11px] font-semibold text-[#0D0303]/75 mb-1"
                >
                  Keperluan
                </label>
                <input
                  id="quick-desc"
                  type="text"
                  value={quickDesc}
                  onChange={(e) => {
                    setQuickError('');
                    setQuickDesc(e.target.value);
                  }}
                  placeholder="Tulis keperluan bebas..."
                  className="w-full min-h-[42px] rounded-xl bg-white border border-[#0D0303]/20 px-3 py-2 text-xs text-[#0D0303] placeholder:text-[#0D0303]/45 focus:outline-none focus:border-[#0D0303]"
                />
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="quick-category"
                  className="block text-[11px] font-semibold text-[#0D0303]/75 mb-1"
                >
                  Kategori
                </label>
                <select
                  id="quick-category"
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-white border border-[#0D0303]/20 px-3 py-2 text-xs text-[#0D0303] focus:outline-none focus:border-[#0D0303]"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1">
                <label
                  htmlFor="quick-type"
                  className="block text-[11px] font-semibold text-[#0D0303]/75 mb-1"
                >
                  Jenis
                </label>
                <select
                  id="quick-type"
                  value={quickType}
                  onChange={(e) =>
                    setQuickType(e.target.value as TransactionType)
                  }
                  className="w-full min-h-[42px] rounded-xl bg-white border border-[#0D0303]/20 px-2.5 py-2 text-xs text-[#0D0303] focus:outline-none focus:border-[#0D0303]"
                >
                  <option value="expense">Keluar</option>
                  <option value="income">Masuk</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="quick-amount"
                  className="block text-[11px] font-semibold text-[#0D0303]/75 mb-1"
                >
                  Nominal (Rp)
                </label>
                <input
                  id="quick-amount"
                  type="text"
                  inputMode="numeric"
                  value={quickAmountRaw}
                  onChange={(e) => {
                    setQuickError('');
                    setQuickAmountRaw(formatRupiahInputDisplay(e.target.value));
                  }}
                  placeholder="10000"
                  className="w-full min-h-[42px] rounded-xl bg-white border border-[#0D0303]/20 px-3 py-2 text-xs font-mono-nums font-semibold text-[#0D0303] placeholder:text-[#0D0303]/45 focus:outline-none focus:border-[#0D0303]"
                />
              </div>

              <div className="lg:col-span-1 sm:col-span-2">
                <button
                  type="submit"
                  className="w-full min-h-[42px] py-2 px-3 rounded-xl bg-[#0D0303] hover:bg-[#220909] text-[#EFF8FF] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Simpan
                </button>
              </div>
            </div>

            {quickError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-[#D90048]">
                {quickError}
              </p>
            )}
          </form>
        )}

        {/* Table Content */}
        {activeTab === 'saldo' ? (
          <>
            {/* Mobile Riwayat Saldo Cards */}
            <div className="md:hidden divide-y divide-[#0D0303]/10">
              {balanceLogs.length === 0 ? (
                <div className="py-10 px-5 text-center text-[#0D0303]/65 text-sm">
                  {isLocked
                    ? 'Riwayat saldo terkunci. Masuk dengan Akun Google terlebih dahulu.'
                    : 'Belum ada riwayat saldo. Gunakan Set Saldo atau Add Saldo pada menu Grafik.'}
                </div>
              ) : (
                balanceLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#0D0303]">
                          {log.action === 'set'
                            ? 'Set Saldo'
                            : log.action === 'add'
                              ? 'Add Saldo'
                              : 'Edit Saldo'}
                        </div>
                        <div className="text-[11px] font-mono-nums text-[#0D0303]/60 mt-0.5">
                          {formatIndonesianDate(log.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-nums text-sm font-bold text-[#0D0303]">
                          {log.action === 'add' ? '+' : ''}
                          {formatRupiah(log.amount)}
                        </div>
                        <div className="text-[11px] font-mono-nums text-[#0D0303]/60">
                          Akhir: {formatRupiah(log.resultingBalance)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-[#0D0303]/75 leading-relaxed">
                        {log.note || '-'}
                      </p>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onEditBalanceLog(log)}
                        aria-label={`Edit riwayat saldo '${log.note}'`}
                        className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#0D0303]/[0.07] hover:bg-[#0D0303]/12 disabled:opacity-45 text-xs font-semibold text-[#0D0303] transition-colors cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Riwayat Saldo Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0D0303]/10 bg-[#E3F1FC]/60 text-[11px] font-semibold text-[#0D0303]/65">
                    <th className="py-3.5 px-6 whitespace-nowrap">Tanggal</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Aksi Saldo</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">
                      Nominal
                    </th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">
                      Saldo Akhir
                    </th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0D0303]/10 text-sm">
                  {balanceLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 px-6 text-center text-[#0D0303]/65 text-sm"
                      >
                        {isLocked
                          ? 'Riwayat saldo terkunci. Masuk dengan Akun Google terlebih dahulu.'
                          : 'Belum ada riwayat saldo. Gunakan Set Saldo atau Add Saldo pada menu Grafik.'}
                      </td>
                    </tr>
                  ) : (
                    balanceLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-[#E3F1FC]/45 transition-colors"
                      >
                        <td className="py-3.5 px-6 font-mono-nums text-xs text-[#0D0303]/70 whitespace-nowrap">
                          {formatIndonesianDate(log.date)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-[#0D0303] whitespace-nowrap">
                          {log.action === 'set'
                            ? 'Set Saldo'
                            : log.action === 'add'
                              ? 'Add Saldo'
                              : 'Edit Saldo'}
                        </td>
                        <td className="py-3.5 px-4 text-sm text-[#0D0303]/85">
                          {log.note || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-nums font-semibold text-[#0D0303] whitespace-nowrap">
                          {log.action === 'add' ? '+' : ''}
                          {formatRupiah(log.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-nums text-xs text-[#0D0303]/70 whitespace-nowrap">
                          {formatRupiah(log.resultingBalance)}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => onEditBalanceLog(log)}
                            aria-label={`Edit riwayat saldo '${log.note}'`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0D0303] hover:bg-[#0D0303]/10 disabled:opacity-45 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Mobile Transactions Card View */}
            <div className="md:hidden divide-y divide-[#0D0303]/10">
              {visibleTransactions.length === 0 ? (
                <div className="py-10 px-5 text-center text-[#0D0303]/70">
                  <p className="text-sm font-semibold text-[#0D0303]">
                    {isLocked
                      ? 'Belum masuk akun'
                      : searchQuery.trim()
                        ? `Tidak ada transaksi yang cocok pada periode ${rangeLabel}.`
                        : 'Belum ada data transaksi'}
                  </p>
                  <p className="text-xs text-[#0D0303]/65 mt-1.5 max-w-md mx-auto leading-relaxed">
                    {isLocked
                      ? 'Masuk dengan Akun Google terlebih dahulu untuk mencatat dan mengelola tabel keuangan.'
                      : searchQuery.trim()
                        ? 'Coba ubah kata kunci pencarian atau pilih rentang waktu lainnya.'
                        : 'Klik Buat Baris Baru untuk mulai mencatat pemasukan atau pengeluaran.'}
                  </p>
                  {isLocked ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={onOpenAccount}
                        className="inline-flex items-center justify-center w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0D0303] hover:bg-[#220909] text-[#EFF8FF] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Masuk Akun Google
                      </button>
                    </div>
                  ) : (
                    !searchQuery.trim() && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleOpenQuickCreate}
                          className="inline-flex items-center justify-center gap-1.5 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#BBEF1F] hover:bg-[#AEE018] text-[#0D0303] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                          <span>Buat Baris Baru</span>
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                visibleTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#0D0303] break-words">
                          {tx.description}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#0D0303]/60">
                          <span className="font-mono-nums">
                            {formatIndonesianDate(tx.date)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.category}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono-nums text-sm font-bold ${
                            tx.type === 'income'
                              ? 'text-emerald-700'
                              : 'text-[#0D0303]'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatRupiah(tx.amount)}
                        </div>
                        <div
                          className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold ${
                            tx.type === 'income'
                              ? 'text-emerald-700'
                              : 'text-[#D90048]'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownLeft className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>
                            {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onEditTransaction(tx)}
                        aria-label={`Edit '${tx.description}'`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#0D0303]/[0.07] hover:bg-[#0D0303]/12 disabled:opacity-45 text-xs font-semibold text-[#0D0303] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onRequestDeleteTransaction(tx)}
                        aria-label={`Hapus '${tx.description}'`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#FF0055]/10 hover:bg-[#FF0055]/20 disabled:opacity-45 text-xs font-semibold text-[#D90048] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Mobile Bottom Summary Card */}
              <div className="bg-[#0D0303] text-[#EFF8FF] p-5 border-t border-[#EFF8FF]/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                      Total Pengeluaran ({rangeLabel})
                    </div>
                    <div className="mt-1 font-mono-nums text-base font-bold text-[#FF0055]">
                      {formatRupiah(totalExpense)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                      Total Pemasukan ({rangeLabel})
                    </div>
                    <div className="mt-1 font-mono-nums text-base font-bold text-[#BBEF1F]">
                      {formatRupiah(totalIncome)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                      Selisih Periode
                    </div>
                    <div
                      className={`mt-1 font-mono-nums text-base font-bold ${
                        netCashflow >= 0 ? 'text-[#EFF8FF]' : 'text-[#FF0055]'
                      }`}
                    >
                      {formatRupiah(netCashflow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                      Saldo Kas Saat Ini
                    </div>
                    <div className="mt-1 font-mono-nums text-base font-bold text-[#EFF8FF]">
                      {formatRupiah(currentBalance)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Transactions Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0D0303]/10 bg-[#E3F1FC]/60 text-[11px] font-semibold text-[#0D0303]/65">
                    <th className="py-3.5 px-6 whitespace-nowrap">Tanggal</th>
                    <th className="py-3.5 px-4">Keperluan</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Jenis</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">
                      Nominal (Rp)
                    </th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#0D0303]/10 text-sm">
                  {visibleTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-14 px-6 text-center text-[#0D0303]/70"
                      >
                        <p className="text-sm font-semibold text-[#0D0303]">
                          {isLocked
                            ? 'Belum masuk akun'
                            : searchQuery.trim()
                              ? `Tidak ada transaksi yang cocok pada periode ${rangeLabel}.`
                              : 'Belum ada data transaksi'}
                        </p>
                        <p className="text-xs text-[#0D0303]/65 mt-1.5 max-w-md mx-auto leading-relaxed">
                          {isLocked
                            ? 'Masuk dengan Akun Google terlebih dahulu untuk mencatat dan mengelola tabel keuangan.'
                            : searchQuery.trim()
                              ? 'Coba ubah kata kunci pencarian atau pilih rentang waktu lainnya.'
                              : 'Klik Buat Baris Baru untuk mulai mencatat pemasukan atau pengeluaran.'}
                        </p>
                        {isLocked ? (
                          <div className="mt-4 flex justify-center">
                            <button
                              type="button"
                              onClick={onOpenAccount}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#0D0303] hover:bg-[#220909] text-[#EFF8FF] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Masuk Akun Google
                            </button>
                          </div>
                        ) : (
                          !searchQuery.trim() && (
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                              <button
                                type="button"
                                onClick={handleOpenQuickCreate}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#BBEF1F] hover:bg-[#AEE018] text-[#0D0303] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                                <span>Buat Baris Baru</span>
                              </button>
                            </div>
                          )
                        )}
                      </td>
                    </tr>
                  ) : (
                    visibleTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#E3F1FC]/45 transition-colors group"
                      >
                        <td className="py-3.5 px-6 font-mono-nums text-xs text-[#0D0303]/70 whitespace-nowrap">
                          {formatIndonesianDate(tx.date)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#0D0303]">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#0D0303]/70 whitespace-nowrap">
                          {tx.category}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              tx.type === 'income'
                                ? 'text-emerald-700'
                                : 'text-[#D90048]'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownLeft
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowUpRight
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono-nums font-bold whitespace-nowrap ${
                            tx.type === 'income'
                              ? 'text-emerald-700'
                              : 'text-[#0D0303]'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => onEditTransaction(tx)}
                              aria-label={`Edit '${tx.description}'`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0D0303] hover:bg-[#0D0303]/10 disabled:opacity-45 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => onRequestDeleteTransaction(tx)}
                              aria-label={`Hapus '${tx.description}'`}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-[#0D0303]/50 hover:text-[#D90048] hover:bg-[#FF0055]/10 disabled:opacity-45 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Ringkasan Pengeluaran Total at the bottom of the table */}
                <tfoot className="bg-[#0D0303] text-[#EFF8FF] border-t border-[#EFF8FF]/10">
                  <tr>
                    <td colSpan={6} className="px-6 py-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                            Ringkasan Pengeluaran Total ({rangeLabel})
                          </div>
                          <div className="mt-1 font-mono-nums text-lg font-bold text-[#FF0055]">
                            {formatRupiah(totalExpense)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                            Total Pemasukan ({rangeLabel})
                          </div>
                          <div className="mt-1 font-mono-nums text-lg font-bold text-[#BBEF1F]">
                            {formatRupiah(totalIncome)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                            Selisih Periode
                          </div>
                          <div
                            className={`mt-1 font-mono-nums text-lg font-bold ${
                              netCashflow >= 0 ? 'text-[#EFF8FF]' : 'text-[#FF0055]'
                            }`}
                          >
                            {formatRupiah(netCashflow)}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <div className="text-[11px] font-medium text-[#EFF8FF]/60">
                            Saldo Kas Saat Ini
                          </div>
                          <div className="mt-1 font-mono-nums text-lg font-bold text-[#EFF8FF]">
                            {formatRupiah(currentBalance)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
