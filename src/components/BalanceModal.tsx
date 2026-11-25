import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pencil, Plus, Wallet, X } from 'lucide-react';
import type { BalanceActionType, BalanceLog } from '../types/finance';
import {
  formatRupiah,
  formatRupiahInputDisplay,
  parseRupiahInput,
} from '../utils/finance';

interface BalanceModalProps {
  open: boolean;
  initialMode: BalanceActionType;
  currentBalance: number;
  editingLog?: BalanceLog | null;
  onClose: () => void;
  onSubmitAction: (payload: {
    mode: BalanceActionType;
    amount: number;
    note: string;
    editingLogId?: string;
  }) => void;
}

export function BalanceModal({
  open,
  initialMode,
  currentBalance,
  editingLog = null,
  onClose,
  onSubmitAction,
}: BalanceModalProps) {
  const [mode, setMode] = useState<BalanceActionType>(initialMode);
  const [amountRaw, setAmountRaw] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingLog) {
      setMode(editingLog.action);
      setAmountRaw(formatRupiah(editingLog.amount));
      setNote(editingLog.note);
    } else {
      setMode(initialMode);
      setAmountRaw(initialMode === 'edit' ? formatRupiah(currentBalance) : '');
      setNote('');
    }
  }, [open, initialMode, currentBalance, editingLog]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const parsedAmount = parseRupiahInput(amountRaw);
  const previewBalance =
    editingLog && editingLog.action === 'add'
      ? currentBalance - editingLog.amount + parsedAmount
      : mode === 'add'
        ? currentBalance + parsedAmount
        : parsedAmount;

  const handleAmountChange = (value: string) => {
    setError('');
    setAmountRaw(formatRupiahInputDisplay(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountRaw.trim() || (mode === 'add' && parsedAmount <= 0)) {
      setError(
        mode === 'add'
          ? 'Masukkan nominal penambahan saldo lebih dari Rp0.'
          : 'Masukkan nominal saldo yang valid.'
      );
      return;
    }

    if (mode === 'add' && !note.trim()) {
      setError('Mohon isi keterangan sumber atau catatan untuk Add Saldo.');
      return;
    }

    onSubmitAction({
      mode,
      amount: parsedAmount,
      note:
        note.trim() ||
        (mode === 'set'
          ? 'Penetapan saldo kas'
          : mode === 'edit'
            ? 'Koreksi saldo manual'
            : 'Penambahan saldo'),
      editingLogId: editingLog?.id,
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
            aria-labelledby="balance-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#161920] border border-white/10 p-5 sm:p-7 text-slate-100 shadow-2xl max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="balance-modal-title"
                  className="font-display text-xl font-bold text-white"
                >
                  {editingLog ? 'Edit Riwayat Saldo' : 'Kelola Saldo Kas'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Atur saldo awal, tambah dana masuk dengan keterangan, atau koreksi saldo.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal saldo"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingLog && (
              <div
                role="tablist"
                aria-label="Mode manajemen saldo"
                className="mt-5 grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0E1117] border border-white/[0.06]"
              >
                {(
                  [
                    { id: 'set', label: 'Set Saldo', icon: Wallet },
                    { id: 'add', label: 'Add Saldo', icon: Plus },
                    { id: 'edit', label: 'Edit Saldo', icon: Pencil },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setMode(item.id);
                        setError('');
                        if (item.id === 'edit') {
                          setAmountRaw(formatRupiah(currentBalance));
                        } else if (item.id === 'add') {
                          setAmountRaw('');
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 min-h-[42px] rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#97F017] text-[#0B0D12] shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="saldo-amount-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  {mode === 'add'
                    ? 'Nominal Tambah Saldo (ketik angka, otomatis format Rp)'
                    : mode === 'set'
                      ? 'Nominal Set Saldo Baru'
                      : 'Nominal Koreksi Saldo'}
                </label>
                <input
                  id="saldo-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full rounded-xl bg-[#0E1117] border border-white/10 px-4 py-3 text-base font-mono-nums font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017] transition-colors"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Hasil format:{' '}
                  <span className="font-mono-nums font-semibold text-[#97F017]">
                    {formatRupiah(parsedAmount)}
                  </span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="saldo-note-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  {mode === 'add'
                    ? 'Keterangan Penambahan Saldo (Wajib)'
                    : 'Keterangan / Catatan (Opsional)'}
                </label>
                <input
                  id="saldo-note-input"
                  type="text"
                  value={note}
                  onChange={(e) => {
                    setError('');
                    setNote(e.target.value);
                  }}
                  placeholder={
                    mode === 'add'
                      ? 'Contoh: Tambahan modal dari rekening BCA'
                      : 'Contoh: Penyesuaian saldo kas fisik'
                  }
                  className="w-full rounded-xl bg-[#0E1117] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017] transition-colors"
                />
              </div>

              <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">Saldo Saat Ini</div>
                  <div className="font-mono-nums text-sm font-semibold text-slate-200 mt-0.5">
                    {formatRupiah(currentBalance)}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs text-slate-400">Estimasi Saldo Akhir</div>
                  <div className="font-mono-nums text-base font-bold text-[#97F017] mt-0.5">
                    {formatRupiah(previewBalance)}
                  </div>
                </div>
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
                  {editingLog
                    ? 'Simpan Perubahan'
                    : mode === 'set'
                      ? 'Terapkan Set Saldo'
                      : mode === 'add'
                        ? 'Tambah Saldo'
                        : 'Simpan Edit Saldo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
