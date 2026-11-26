import { motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Wallet } from 'lucide-react';
import type { BalanceActionType, TimeRangeKey } from '../types/finance';
import { TIME_RANGE_OPTIONS, formatRupiah } from '../utils/finance';
import { AnimatedNumber } from './AnimatedNumber';

interface HeroOverviewProps {
  currentBalance: number;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  transactionCount: number;
  activeRange: TimeRangeKey;
  rangeLabel: string;
  isLocked: boolean;
  onRangeChange: (range: TimeRangeKey) => void;
  onOpenBalanceModal: (mode: BalanceActionType) => void;
  onOpenNewTransaction: () => void;
}

export function HeroOverview({
  currentBalance,
  totalExpense,
  totalIncome,
  netCashflow,
  transactionCount,
  activeRange,
  rangeLabel,
  isLocked,
  onRangeChange,
  onOpenBalanceModal,
  onOpenNewTransaction,
}: HeroOverviewProps) {
  const volume = totalIncome + totalExpense;
  const incomeRatio = volume > 0 ? Math.round((totalIncome / volume) * 100) : 50;
  const expenseRatio = volume > 0 ? 100 - incomeRatio : 50;

  return (
    <section
      id="ringkasan"
      aria-label="Ringkasan dan Grafik Keuangan"
      className="scroll-mt-4 md:scroll-mt-8 max-w-[1380px] mx-auto px-4 sm:px-8 pt-5 sm:pt-7 pb-6 sm:pb-8"
    >
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#EFF8FF] [text-wrap:balance]">
            Ringkasan & Grafik
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#EFF8FF]/65">
            Periode aktif: <span className="text-[#EFF8FF] font-medium">{rangeLabel}</span>
            <span aria-hidden="true" className="mx-2 text-[#EFF8FF]/30">·</span>
            <span className="text-[#EFF8FF]/80">
              <span className="font-mono-nums">{transactionCount}</span> transaksi
            </span>
          </p>
        </div>

        <button
          type="button"
          disabled={isLocked}
          onClick={onOpenNewTransaction}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#BBEF1F] hover:bg-[#AEE018] disabled:opacity-40 disabled:cursor-not-allowed text-[#0D0303] text-sm font-bold transition-transform duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span>Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Period Filter Strip */}
      <div
        role="group"
        aria-label="Filter rentang waktu grafik dan ringkasan"
        className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#150A0B] border border-[#EFF8FF]/[0.08] mb-5 sm:mb-6 w-full lg:w-fit"
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

      {/* Main 2-Column Obsidian Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left Card: Cashflow Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 rounded-3xl sm:rounded-[28px] bg-[#150A0B] border border-[#EFF8FF]/[0.08] p-5 sm:p-7 flex flex-col justify-between gap-6 sm:gap-7"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#EFF8FF]/65">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#FF0055] shrink-0" aria-hidden="true" />
                <span>Total Pengeluaran</span>
              </div>
              <div className="mt-1.5 sm:mt-2 text-lg sm:text-[26px] font-bold text-[#EFF8FF] tracking-tight break-words">
                <AnimatedNumber value={totalExpense} />
              </div>
              <div className="mt-1 text-xs text-[#EFF8FF]/45">{rangeLabel}</div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#EFF8FF]/65">
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#BBEF1F] shrink-0" aria-hidden="true" />
                <span>Total Pemasukan</span>
              </div>
              <div className="mt-1.5 sm:mt-2 text-lg sm:text-[26px] font-bold text-[#EFF8FF] tracking-tight break-words">
                <AnimatedNumber value={totalIncome} />
              </div>
              <div className="mt-1 text-xs text-[#EFF8FF]/45">{rangeLabel}</div>
            </div>

            <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EFF8FF]/[0.08]">
              <div className="text-xs font-medium text-[#EFF8FF]/65">Arus Kas Bersih</div>
              <div
                className={`mt-1.5 sm:mt-2 text-xl sm:text-[26px] font-bold tracking-tight ${
                  netCashflow >= 0 ? 'text-[#BBEF1F]' : 'text-[#FF0055]'
                }`}
              >
                <AnimatedNumber value={netCashflow} />
              </div>
              <div className="mt-1 text-xs text-[#EFF8FF]/45">
                {netCashflow >= 0 ? 'Surplus periode' : 'Defisit periode'}
              </div>
            </div>
          </div>

          {/* Segmented Proportion Meter */}
          <div className="space-y-3 pt-2 border-t border-[#EFF8FF]/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#EFF8FF]/65">
              <span>Rasio Pemasukan vs Pengeluaran ({rangeLabel})</span>
              <span className="font-mono-nums text-[#EFF8FF] whitespace-nowrap shrink-0">
                {incomeRatio}% Masuk · {expenseRatio}% Keluar
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-[#0D0303] overflow-hidden flex gap-1 p-0.5 border border-[#EFF8FF]/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${incomeRatio}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-[#BBEF1F]"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${expenseRatio}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-[#FF0055]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#EFF8FF]/65 pt-1">
              <span>
                Volume transaksi:{' '}
                <strong className="font-mono-nums text-[#EFF8FF]">
                  {formatRupiah(volume)}
                </strong>
              </span>
              <span>
                {isLocked ? 'Masuk akun untuk kelola kas' : 'Otomatis sinkron dengan saldo kas'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Card: Balance Vault with Set / Add / Edit Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 rounded-3xl sm:rounded-[28px] bg-[#150A0B] border border-[#EFF8FF]/[0.08] p-5 sm:p-7 flex flex-col justify-between gap-5 sm:gap-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#EFF8FF]/65">
                Saldo Kas Tersedia
              </div>
              <div className="mt-1.5 sm:mt-2 text-2xl sm:text-4xl font-bold text-[#EFF8FF] tracking-tight">
                <AnimatedNumber value={currentBalance} />
              </div>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onOpenBalanceModal('edit')}
              aria-label="Edit saldo saat ini"
              className="w-11 h-11 rounded-full bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/12 text-[#EFF8FF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 3 Interactive Balance Action Tiles */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 items-end pt-1">
            <motion.button
              type="button"
              disabled={isLocked}
              whileHover={isLocked ? undefined : { y: -3 }}
              whileTap={isLocked ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onOpenBalanceModal('set')}
              className="rounded-2xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/[0.09] disabled:opacity-40 disabled:cursor-not-allowed p-2.5 sm:p-3.5 text-left flex flex-col justify-between min-h-[92px] sm:h-[104px] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-[#EFF8FF]/60">Atur</span>
                <Wallet className="w-3.5 h-3.5 text-[#EFF8FF]/80 shrink-0" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#EFF8FF] whitespace-nowrap">
                  Set Saldo
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#EFF8FF]/55 truncate">
                  Nominal awal
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              disabled={isLocked}
              whileHover={isLocked ? undefined : { y: -4 }}
              whileTap={isLocked ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onOpenBalanceModal('add')}
              className="rounded-2xl bg-[#BBEF1F] hover:bg-[#AEE018] disabled:opacity-40 disabled:cursor-not-allowed text-[#0D0303] p-2.5 sm:p-3.5 text-left flex flex-col justify-between min-h-[104px] sm:h-[118px] shadow-lg shadow-[#BBEF1F]/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-[#0D0303]/70">
                  + Dana
                </span>
                <Plus className="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                  Add Saldo
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-[#0D0303]/75 truncate">
                  Dengan catatan
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              disabled={isLocked}
              whileHover={isLocked ? undefined : { y: -3 }}
              whileTap={isLocked ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onOpenBalanceModal('edit')}
              className="rounded-2xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/[0.09] disabled:opacity-40 disabled:cursor-not-allowed p-2.5 sm:p-3.5 text-left flex flex-col justify-between min-h-[92px] sm:h-[104px] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-[#EFF8FF]/60">Revisi</span>
                <Pencil className="w-3.5 h-3.5 text-[#EFF8FF]/80 shrink-0" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#EFF8FF] whitespace-nowrap">
                  Edit Saldo
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#EFF8FF]/55 truncate">
                  Koreksi kas
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
