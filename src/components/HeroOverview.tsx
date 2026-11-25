import { motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Wallet } from 'lucide-react';
import type { BalanceActionType } from '../types/finance';
import { formatRupiah } from '../utils/finance';
import { AnimatedNumber } from './AnimatedNumber';

interface HeroOverviewProps {
  currentBalance: number;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  transactionCount: number;
  rangeLabel: string;
  onOpenBalanceModal: (mode: BalanceActionType) => void;
  onOpenNewTransaction: () => void;
}

export function HeroOverview({
  currentBalance,
  totalExpense,
  totalIncome,
  netCashflow,
  transactionCount,
  rangeLabel,
  onOpenBalanceModal,
  onOpenNewTransaction,
}: HeroOverviewProps) {
  const volume = totalIncome + totalExpense;
  const incomeRatio = volume > 0 ? Math.round((totalIncome / volume) * 100) : 50;
  const expenseRatio = volume > 0 ? 100 - incomeRatio : 50;

  return (
    <section
      id="ringkasan"
      aria-label="Ringkasan Keuangan"
      className="scroll-mt-4 md:scroll-mt-24 max-w-[1380px] mx-auto px-4 sm:px-8 pt-5 sm:pt-6 pb-6 sm:pb-8"
    >
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Pembukuan Keuangan
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Periode aktif: <span className="text-slate-200 font-medium">{rangeLabel}</span>
            <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
            <span className="text-slate-300">
              <span className="font-mono-nums">{transactionCount}</span> transaksi
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTransaction}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#97F017] hover:bg-[#8CE615] text-[#0B0D12] text-sm font-bold transition-transform duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span>Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Main 2-Column Obsidian Dashboard Grid (matching reference architecture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left Card: Cashflow Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 rounded-3xl sm:rounded-[28px] bg-[#161920] border border-white/[0.06] p-5 sm:p-7 flex flex-col justify-between gap-6 sm:gap-7"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
                <span>Total Pengeluaran</span>
              </div>
              <div className="mt-1.5 sm:mt-2 text-lg sm:text-[26px] font-bold text-white tracking-tight break-words">
                <AnimatedNumber value={totalExpense} />
              </div>
              <div className="mt-1 text-xs text-slate-500">{rangeLabel}</div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#97F017] shrink-0" aria-hidden="true" />
                <span>Total Pemasukan</span>
              </div>
              <div className="mt-1.5 sm:mt-2 text-lg sm:text-[26px] font-bold text-white tracking-tight break-words">
                <AnimatedNumber value={totalIncome} />
              </div>
              <div className="mt-1 text-xs text-slate-500">{rangeLabel}</div>
            </div>

            <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
              <div className="text-xs font-medium text-slate-400">Arus Kas Bersih</div>
              <div
                className={`mt-1.5 sm:mt-2 text-xl sm:text-[26px] font-bold tracking-tight ${
                  netCashflow >= 0 ? 'text-[#97F017]' : 'text-rose-400'
                }`}
              >
                <AnimatedNumber value={netCashflow} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {netCashflow >= 0 ? 'Surplus periode' : 'Defisit periode'}
              </div>
            </div>
          </div>

          {/* Segmented Proportion Meter (clean visual echo of reference timeline bars) */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>Rasio Pemasukan vs Pengeluaran ({rangeLabel})</span>
              <span className="font-mono-nums text-slate-200 whitespace-nowrap shrink-0">
                {incomeRatio}% Masuk · {expenseRatio}% Keluar
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-[#0E1117] overflow-hidden flex gap-1 p-0.5 border border-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${incomeRatio}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-[#97F017]"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${expenseRatio}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-rose-500/80"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <span>
                Volume transaksi:{' '}
                <strong className="font-mono-nums text-slate-200">
                  {formatRupiah(volume)}
                </strong>
              </span>
              <span>Otomatis sinkron dengan saldo kas</span>
            </div>
          </div>
        </motion.div>

        {/* Right Card: Balance Vault with Set / Add / Edit Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 rounded-3xl sm:rounded-[28px] bg-[#161920] border border-white/[0.06] p-5 sm:p-7 flex flex-col justify-between gap-5 sm:gap-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-400">
                Saldo Kas Tersedia
              </div>
              <div className="mt-1.5 sm:mt-2 text-2xl sm:text-4xl font-bold text-white tracking-tight">
                <AnimatedNumber value={currentBalance} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenBalanceModal('edit')}
              aria-label="Edit saldo saat ini"
              className="w-11 h-11 rounded-full bg-[#1F242E] hover:bg-[#282E3A] border border-white/10 text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 3 Interactive Balance Action Tiles inspired by reference stacked cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 items-end pt-1">
            <motion.button
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onOpenBalanceModal('set')}
              className="rounded-2xl bg-[#1F242E] hover:bg-[#252B37] border border-white/[0.07] p-2.5 sm:p-3.5 text-left flex flex-col justify-between min-h-[92px] sm:h-[104px] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-slate-400">Atur</span>
                <Wallet className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  Set Saldo
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  Nominal awal
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onOpenBalanceModal('add')}
              className="rounded-2xl bg-[#97F017] hover:bg-[#8CE615] text-[#0B0D12] p-2.5 sm:p-3.5 text-left flex flex-col justify-between min-h-[104px] sm:h-[118px] shadow-lg shadow-[#97F017]/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-[#0B0D12]/70">
                  + Dana
                </span>
                <Plus className="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                  Add Saldo
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-[#0B0D12]/75 truncate">
                  Dengan catatan
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onOpenBalanceModal('edit')}
              className="rounded-2xl bg-[#1F242E] hover:bg-[#252B37] border border-white/[0.07] p-2.5 sm:p-3.5 text-left flex flex-col justify-between min-h-[92px] sm:h-[104px] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-slate-400">Revisi</span>
                <Pencil className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  Edit Saldo
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
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
