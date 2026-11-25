import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import type { TimeRangeKey, Transaction } from '../types/finance';
import { buildChartSeries, formatRupiah } from '../utils/finance';

interface CashflowChartsProps {
  transactions: Transaction[];
  range: TimeRangeKey;
  rangeLabel: string;
}

export function CashflowCharts({
  transactions,
  range,
  rangeLabel,
}: CashflowChartsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const series = useMemo(
    () => buildChartSeries(transactions, range),
    [transactions, range]
  );

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let totalExp = 0;
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      totalExp += tx.amount;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }
    return {
      totalExp,
      items: Array.from(map.entries())
        .map(([name, amount]) => ({
          name,
          amount,
          percent: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    };
  }, [transactions]);

  const maxBucketValue = useMemo(() => {
    let maxVal = 100000;
    for (const b of series) {
      if (b.income > maxVal) maxVal = b.income;
      if (b.expense > maxVal) maxVal = b.expense;
    }
    return maxVal;
  }, [series]);

  const activeBucket =
    hoveredIdx !== null && series[hoveredIdx] ? series[hoveredIdx] : null;

  return (
    <section
      id="grafik"
      aria-label="Grafik Pemasukan dan Pengeluaran"
      className="scroll-mt-4 md:scroll-mt-24 max-w-[1380px] mx-auto px-4 sm:px-8 pb-6 sm:pb-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left: Interactive Cashflow Bar + Trend Chart */}
        <div className="lg:col-span-8 rounded-3xl sm:rounded-[28px] bg-[#161920] border border-white/[0.06] p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Grafik Arus Kas ({rangeLabel})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan pemasukan dan pengeluaran secara kronologis
              </p>
            </div>

            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#97F017]" aria-hidden="true" />
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-400" aria-hidden="true" />
                <span>Pengeluaran</span>
              </div>
            </div>
          </div>

          {series.length === 0 ? (
            <div className="h-[200px] sm:h-[230px] flex flex-col items-center justify-center text-center rounded-2xl bg-[#0E1117] border border-white/[0.05] p-5 sm:p-6">
              <BarChart3 className="w-8 h-8 text-slate-500 mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-300">
                Belum ada data grafik
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hubungkan Google Sheets atau catat transaksi untuk melihat visualisasi arus kas.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Hover / Tap Summary Readout */}
              <div className="min-h-[36px] mb-3 px-3.5 py-2 rounded-xl bg-[#0E1117] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                {activeBucket ? (
                  <>
                    <span className="font-semibold text-white">
                      {activeBucket.label}
                    </span>
                    <div className="flex items-center gap-3 sm:gap-4 font-mono-nums">
                      <span className="text-[#97F017]">
                        Masuk: {formatRupiah(activeBucket.income)}
                      </span>
                      <span className="text-rose-400">
                        Keluar: {formatRupiah(activeBucket.expense)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400">
                    Ketuk atau arahkan kursor ke batang grafik untuk rincian nominal
                  </span>
                )}
              </div>

              <div className="h-[205px] flex items-end gap-2 sm:gap-3 pt-4 pb-1 overflow-x-auto">
                {series.map((bucket, idx) => {
                  const incHeight = Math.max(
                    bucket.income > 0 ? 8 : 2,
                    Math.round((bucket.income / maxBucketValue) * 155)
                  );
                  const expHeight = Math.max(
                    bucket.expense > 0 ? 8 : 2,
                    Math.round((bucket.expense / maxBucketValue) * 155)
                  );
                  const isHovered = hoveredIdx === idx;

                  return (
                    <div
                      key={bucket.key}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => setHoveredIdx(idx)}
                      onFocus={() => setHoveredIdx(idx)}
                      onBlur={() => setHoveredIdx(null)}
                      tabIndex={0}
                      aria-label={`${bucket.label}: Pemasukan ${formatRupiah(
                        bucket.income
                      )}, Pengeluaran ${formatRupiah(bucket.expense)}`}
                      className={`flex-1 min-w-[44px] flex flex-col items-center gap-2 rounded-xl px-1.5 py-2 transition-colors outline-none cursor-pointer ${
                        isHovered ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <div className="h-[160px] w-full flex items-end justify-center gap-1.5">
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.45,
                            delay: Math.min(idx * 0.03, 0.25),
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{
                            height: `${incHeight}px`,
                            transformOrigin: 'bottom',
                          }}
                          className="w-3 sm:w-4 rounded-t-md bg-[#97F017]"
                        />
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.45,
                            delay: Math.min(idx * 0.03 + 0.04, 0.3),
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{
                            height: `${expHeight}px`,
                            transformOrigin: 'bottom',
                          }}
                          className="w-3 sm:w-4 rounded-t-md bg-rose-400"
                        />
                      </div>
                      <span className="text-[11px] font-mono-nums text-slate-400 whitespace-nowrap">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Category Spending Breakdown */}
        <div className="lg:col-span-4 rounded-[28px] bg-[#161920] border border-white/[0.06] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Kategori Pengeluaran
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pos pengeluaran terbesar pada {rangeLabel}
            </p>

            {categoryBreakdown.items.length === 0 ? (
              <div className="mt-8 text-center py-10 rounded-2xl bg-[#0E1117] border border-white/[0.05]">
                <p className="text-xs text-slate-400">
                  Belum ada pengeluaran pada periode ini.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {categoryBreakdown.items.map((cat, idx) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200 truncate pr-2">
                        {cat.name}
                      </span>
                      <span className="font-mono-nums text-slate-300 shrink-0">
                        {formatRupiah(cat.amount)}{' '}
                        <span className="text-slate-500">({cat.percent}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#0E1117] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(cat.percent, 4)}%` }}
                        transition={{
                          duration: 0.45,
                          delay: idx * 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-[#97F017]' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Terkategori</span>
            <span className="font-mono-nums font-bold text-white">
              {formatRupiah(categoryBreakdown.totalExp)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
