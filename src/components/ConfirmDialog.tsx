import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  details = [],
  confirmLabel,
  cancelLabel = 'Batal',
  tone = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => !isLoading && onCancel()}
            className="fixed inset-0 bg-[#0D0303]/80 backdrop-blur-xs"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#150A0B] border border-[#EFF8FF]/12 p-5 sm:p-6 text-[#EFF8FF] shadow-2xl max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tone === 'danger'
                      ? 'bg-[#FF0055]/15 text-[#FF0055]'
                      : 'bg-[#BBEF1F]/15 text-[#BBEF1F]'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3
                  id="confirm-dialog-title"
                  className="font-display text-lg font-bold text-[#EFF8FF]"
                >
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                aria-label="Tutup dialog konfirmasi"
                className="p-1.5 rounded-lg text-[#EFF8FF]/60 hover:text-[#EFF8FF] hover:bg-[#EFF8FF]/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#EFF8FF]/80">
              {description}
            </p>

            {details.length > 0 && (
              <ul className="mt-3 space-y-1.5 rounded-xl bg-[#0D0303] border border-[#EFF8FF]/[0.08] p-3 text-xs text-[#EFF8FF]/75">
                {details.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#EFF8FF]/80 bg-[#1E1012] hover:bg-[#291619] transition-colors cursor-pointer whitespace-nowrap"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  tone === 'danger'
                    ? 'bg-[#FF0055] hover:bg-[#E0004B] text-[#EFF8FF]'
                    : 'bg-[#BBEF1F] hover:bg-[#AEE018] text-[#0D0303]'
                } disabled:opacity-60`}
              >
                {isLoading ? 'Memproses...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
