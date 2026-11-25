import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import type { Transaction, TransactionType } from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  formatRupiah,
  formatRupiahInputDisplay,
  getTodayISODate,
  parseRupiahInput,
} from '../utils/finance';

interface TransactionModalProps {
  open: boolean;
  editingTransaction: Transaction | null;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    date: string;
    description: string;
    category: string;
    type: TransactionType;
    amount: number;
  }) => void;
}

export function TransactionModal({
  open,
  editingTransaction,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [date, setDate] = useState(getTodayISODate());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [type, setType] = useState<TransactionType>('expense');
  const [amountRaw, setAmountRaw] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setType(editingTransaction.type);
      setAmountRaw(formatRupiah(editingTransaction.amount));
    } else {
      setDate(getTodayISODate());
      setDescription('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setType('expense');
      setAmountRaw('');
    }
  }, [open, editingTransaction]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const parsedAmount = parseRupiahInput(amountRaw);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Mohon isi keperluan transaksi.');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Mohon masukkan nominal lebih dari Rp0.');
      return;
    }
    if (!date) {
      setError('Mohon pilih tanggal transaksi.');
      return;
    }

    onSave({
      id: editingTransaction?.id,
      date,
      description: description.trim(),
      category: category.trim() || 'Lainnya',
      type,
      amount: parsedAmount,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#161920] border border-white/10 p-5 sm:p-7 text-slate-100 shadow-2xl max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="tx-modal-title"
                  className="font-display text-xl font-bold text-white"
                >
                  {editingTransaction
                    ? 'Edit Baris Transaksi'
                    : 'Catat Transaksi Baru'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tanggal otomatis terisi hari ini dan dapat disesuaikan kapan saja.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal transaksi"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0E1117] border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  <span>Pengeluaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    if (category === 'Operasional') {
                      setCategory('Pemasukan Usaha');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-[#97F017] text-[#0B0D12]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Pemasukan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="tx-date-input"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Tanggal
                  </label>
                  <input
                    id="tx-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl bg-[#0E1117] border border-white/10 px-3.5 py-2.5 text-sm font-mono-nums text-white focus:outline-none focus:border-[#97F017]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tx-category-input"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Kategori
                  </label>
                  <select
                    id="tx-category-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-[#0E1117] border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#97F017]"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tx-desc-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Keperluan (Tulis bebas)
                </label>
                <input
                  id="tx-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setError('');
                    setDescription(e.target.value);
                  }}
                  placeholder="Contoh: Beli perlengkapan ATK, bayar listrik, atau penjualan"
                  className="w-full rounded-xl bg-[#0E1117] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017]"
                />
              </div>

              <div>
                <label
                  htmlFor="tx-amount-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Nominal (Rp) — ketik angka langsung, contoh 10000
                </label>
                <input
                  id="tx-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={(e) => {
                    setError('');
                    setAmountRaw(formatRupiahInputDisplay(e.target.value));
                  }}
                  placeholder="10000"
                  className="w-full rounded-xl bg-[#0E1117] border border-white/10 px-4 py-3 text-base font-mono-nums font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017]"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Format tersimpan:{' '}
                  <span className="font-mono-nums font-bold text-[#97F017]">
                    {formatRupiah(parsedAmount)}
                  </span>
                </p>
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-red-400">
                  {error}
                </p>
              )}

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-[#97F017] hover:bg-[#8CE615] text-[#0B0D12] transition-all cursor-pointer"
                >
                  {editingTransaction ? 'Simpan Perubahan' : 'Simpan ke Tabel'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
