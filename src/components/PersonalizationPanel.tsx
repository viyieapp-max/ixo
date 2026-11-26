import { useEffect, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';

interface PersonalizationPanelProps {
  brandName: string;
  isLocked: boolean;
  onUpdateBrandName: (newBrandName: string) => void;
}

export function PersonalizationPanel({
  brandName,
  isLocked,
  onUpdateBrandName,
}: PersonalizationPanelProps) {
  const [draftBrand, setDraftBrand] = useState(brandName);
  const [brandError, setBrandError] = useState('');

  useEffect(() => {
    setDraftBrand(brandName);
  }, [brandName]);

  const previewLetter = (draftBrand.trim()[0] || 'K').toUpperCase();

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const cleaned = draftBrand.trim();
    if (!cleaned) {
      setBrandError('Nama tampilan tidak boleh kosong.');
      return;
    }
    setBrandError('');
    onUpdateBrandName(cleaned);
  };

  const handleResetBrand = () => {
    if (isLocked) return;
    setBrandError('');
    setDraftBrand('KasBuku');
    onUpdateBrandName('KasBuku');
  };

  return (
    <section
      aria-label="Personalisasi Aplikasi"
      className="max-w-[1380px] mx-auto px-4 sm:px-8 pt-5 sm:pt-7 pb-10 sm:pb-14"
    >
      <div className="mb-5 sm:mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#BBEF1F] mb-1.5">
          <Palette className="w-4 h-4" aria-hidden="true" />
          <span>Personalisasi</span>
        </div>
        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#EFF8FF]">
          Personalisasi Aplikasi & Usaha
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#EFF8FF]/65">
          Sesuaikan judul aplikasi di menu kiri, header seluler, tab browser, dan laporan PDF sesuai nama usaha Anda.
        </p>
      </div>

      <div className="rounded-3xl sm:rounded-[28px] bg-[#150A0B] border border-[#EFF8FF]/[0.08] p-5 sm:p-8">
        <form
          onSubmit={handleSaveBrand}
          className="rounded-2xl bg-[#0D0303] border border-[#EFF8FF]/[0.08] p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EFF8FF]/[0.08]">
            <div>
              <h2 className="font-display text-base font-bold text-[#EFF8FF]">
                Nama Tampilan & Monogram
              </h2>
              <p className="text-xs text-[#EFF8FF]/65 mt-1">
                Ubah nama default KasBuku bebas sesuai merek Anda, misalnya HansStore.
              </p>
            </div>

            {/* Live Preview */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#150A0B] border border-[#EFF8FF]/12 self-start sm:self-auto shrink-0">
              <span
                aria-hidden="true"
                className="w-7 h-7 rounded-lg bg-[#BBEF1F] text-[#0D0303] flex items-center justify-center font-extrabold text-sm"
              >
                {previewLetter}
              </span>
              <span className="font-display text-sm font-bold text-[#EFF8FF] max-w-[180px] truncate">
                {draftBrand.trim() || 'KasBuku'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-7">
              <label
                htmlFor="brand-name-input"
                className="block text-xs font-semibold text-[#EFF8FF]/80 mb-1.5"
              >
                Nama Tampilan (Contoh: HansStore)
              </label>
              <input
                id="brand-name-input"
                type="text"
                maxLength={32}
                disabled={isLocked}
                value={draftBrand}
                onChange={(e) => {
                  setBrandError('');
                  setDraftBrand(e.target.value);
                }}
                placeholder="Contoh: HansStore"
                className="w-full min-h-[44px] rounded-xl bg-[#150A0B] border border-[#EFF8FF]/12 px-4 py-2.5 text-sm text-[#EFF8FF] placeholder:text-[#EFF8FF]/40 focus:outline-none focus:border-[#BBEF1F] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div className="md:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="submit"
                disabled={isLocked}
                className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#BBEF1F] hover:bg-[#AEE018] disabled:opacity-45 disabled:cursor-not-allowed text-[#0D0303] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Simpan Nama
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={handleResetBrand}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/10 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#EFF8FF] transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset KasBuku</span>
              </button>
            </div>
          </div>

          {brandError && (
            <p role="alert" className="text-xs font-medium text-[#FF0055]">
              {brandError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
