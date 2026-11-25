import { useEffect, useState } from 'react';
import {
  CloudDownload,
  CloudUpload,
  ExternalLink,
  FilePlus2,
  FileSpreadsheet,
  Link2,
  LogOut,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';

export type LainnyaTabKey = 'sheets' | 'account' | 'personalization';

export interface AccountProfileView {
  email: string;
  displayName: string;
  photoURL: string;
}

interface LainnyaSectionProps {
  activeTab: LainnyaTabKey;
  onTabChange: (tab: LainnyaTabKey) => void;
  brandName: string;
  onUpdateBrandName: (newBrandName: string) => void;
  profile: AccountProfileView | null;
  isAuthenticated: boolean;
  hasToken: boolean;
  isLoggingIn: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetTabName: string;
  availableTabs: string[];
  lastSyncedAt: string | null;
  isBusy: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  onGoogleLogin: () => void;
  onSwitchAccount: () => void;
  onReconsentSheets: () => void;
  onGoogleLogout: () => void;
  onConnectSpreadsheet: (idOrUrl: string) => void;
  onCreateSpreadsheet: (title: string) => void;
  onSelectTab: (tabName: string) => void;
  onPullFromSheet: () => void;
  onRequestPushToSheet: () => void;
}

function GoogleSignInButton({
  isLoggingIn,
  onClick,
}: {
  isLoggingIn: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoggingIn}
      className="gsi-material-button shrink-0"
    >
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block' }}
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="gsi-material-button-contents">
          {isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}
        </span>
      </div>
    </button>
  );
}

export function LainnyaSection({
  activeTab,
  onTabChange,
  brandName,
  onUpdateBrandName,
  profile,
  isAuthenticated,
  hasToken,
  isLoggingIn,
  spreadsheetId,
  spreadsheetTitle,
  sheetTabName,
  availableTabs,
  lastSyncedAt,
  isBusy,
  statusMessage,
  errorMessage,
  onGoogleLogin,
  onSwitchAccount,
  onReconsentSheets,
  onGoogleLogout,
  onConnectSpreadsheet,
  onCreateSpreadsheet,
  onSelectTab,
  onPullFromSheet,
  onRequestPushToSheet,
}: LainnyaSectionProps) {
  const canUseSheets = isAuthenticated || hasToken;
  const [sheetInput, setSheetInput] = useState(spreadsheetId);
  const [newSheetTitle, setNewSheetTitle] = useState(
    `${brandName || 'KasBuku'} Pembukuan Keuangan`
  );
  const [draftBrand, setDraftBrand] = useState(brandName);
  const [brandError, setBrandError] = useState('');

  useEffect(() => {
    setDraftBrand(brandName);
  }, [brandName]);

  useEffect(() => {
    setSheetInput(spreadsheetId);
  }, [spreadsheetId]);

  const previewLetter = (draftBrand.trim()[0] || 'K').toUpperCase();

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftBrand.trim();
    if (!cleaned) {
      setBrandError('Nama tampilan tidak boleh kosong.');
      return;
    }
    setBrandError('');
    onUpdateBrandName(cleaned);
  };

  const handleResetBrand = () => {
    setBrandError('');
    setDraftBrand('KasBuku');
    onUpdateBrandName('KasBuku');
  };

  return (
    <section
      id="lainnya"
      aria-label="Lainnya: Google Sheets, Akun, dan Personalisasi"
      className="scroll-mt-4 md:scroll-mt-24 max-w-[1380px] mx-auto px-4 sm:px-8 pb-10 sm:pb-14"
    >
      <div className="rounded-3xl sm:rounded-[28px] bg-[#161920] border border-white/[0.06] p-5 sm:p-8">
        {/* Header + 3-Submenu Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Lainnya
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Kelola integrasi Google Sheets, akun Google, dan personalisasi judul aplikasi.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Submenu Lainnya"
            className="grid grid-cols-3 sm:inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#0E1117] border border-white/[0.06] w-full lg:w-auto"
          >
            {(
              [
                { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
                { id: 'account', label: 'Akun', icon: UserCircle2 },
                { id: 'personalization', label: 'Personalisasi', icon: Palette },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 min-h-[42px] rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#97F017] text-[#0B0D12] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-menu 1: Google Sheets */}
        {activeTab === 'sheets' && (
          <div id="google-sheets" className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Integrasi Google Sheets
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hubungkan spreadsheet Anda atau buat Google Sheet baru untuk mencadangkan dan
                  menyinkronkan tabel transaksi beserta riwayat saldo.
                </p>
              </div>

              {!profile ? (
                <GoogleSignInButton
                  isLoggingIn={isLoggingIn}
                  onClick={onGoogleLogin}
                />
              ) : (
                <div className="text-xs text-slate-300">
                  Terhubung sebagai{' '}
                  <strong className="text-[#97F017] font-semibold">
                    {profile.email || profile.displayName}
                  </strong>
                  {lastSyncedAt ? (
                    <>
                      <span aria-hidden="true" className="mx-2 text-slate-600">
                        ·
                      </span>
                      <span className="text-slate-400">
                        Sinkron terakhir: {new Date(lastSyncedAt).toLocaleTimeString('id-ID')}
                      </span>
                    </>
                  ) : (
                    !hasToken && (
                      <>
                        <span aria-hidden="true" className="mx-2 text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-400">Login tersimpan</span>
                      </>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Option 1: Create new Google Sheet */}
              <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <FilePlus2 className="w-4 h-4 text-[#97F017]" aria-hidden="true" />
                  <span>Buat Google Sheet Baru</span>
                </div>
                <p className="text-xs text-slate-400">
                  Otomatis membuat file spreadsheet dengan tab Transaksi dan RingkasanSaldo di akun Google Anda.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <input
                    type="text"
                    aria-label="Nama Google Sheet baru"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="Nama spreadsheet..."
                    className="flex-1 min-h-[42px] rounded-xl bg-[#161920] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017]"
                  />
                  <button
                    type="button"
                    disabled={!canUseSheets || isBusy}
                    onClick={() => onCreateSpreadsheet(newSheetTitle)}
                    className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 rounded-xl bg-[#97F017] hover:bg-[#8CE615] disabled:opacity-45 text-[#0B0D12] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Buat Spreadsheet
                  </button>
                </div>
              </div>

              {/* Option 2: Connect existing Google Sheet by URL or ID */}
              <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Link2 className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  <span>Hubungkan Spreadsheet yang Ada</span>
                </div>
                <p className="text-xs text-slate-400">
                  Tempel URL atau ID Google Sheet Anda, lalu pilih nama tab sheet secara otomatis.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <input
                    type="text"
                    aria-label="URL atau ID Google Sheet"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 min-h-[42px] rounded-xl bg-[#161920] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017]"
                  />
                  <button
                    type="button"
                    disabled={!canUseSheets || isBusy || !sheetInput.trim()}
                    onClick={() => onConnectSpreadsheet(sheetInput)}
                    className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-45 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Hubungkan
                  </button>
                </div>
              </div>
            </div>

            {/* Active Spreadsheet Controls */}
            {spreadsheetId && (
              <div className="mt-5 rounded-2xl bg-[#0E1117] border border-white/[0.08] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-white">
                      {spreadsheetTitle || 'Spreadsheet Terhubung'}
                    </span>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#97F017] hover:underline"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="text-xs font-mono-nums text-slate-400 break-all">
                    ID: {spreadsheetId}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
                  {availableTabs.length > 0 && (
                    <select
                      aria-label="Pilih tab spreadsheet"
                      value={sheetTabName}
                      onChange={(e) => onSelectTab(e.target.value)}
                      className="w-full sm:w-auto min-h-[42px] rounded-xl bg-[#161920] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#97F017]"
                    >
                      {availableTabs.map((tab) => (
                        <option key={tab} value={tab}>
                          Tab: {tab}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    disabled={!canUseSheets || isBusy}
                    onClick={onPullFromSheet}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-45 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isBusy ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <CloudDownload className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Muat dari Sheet</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canUseSheets || isBusy}
                    onClick={onRequestPushToSheet}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#97F017] hover:bg-[#8CE615] disabled:opacity-45 text-xs font-bold text-[#0B0D12] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CloudUpload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sinkron ke Google Sheet</span>
                  </button>
                </div>
              </div>
            )}

            {statusMessage && (
              <p
                role="status"
                className="mt-4 text-xs font-medium text-[#97F017]"
              >
                {statusMessage}
              </p>
            )}
            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <p className="text-xs font-medium text-rose-300">{errorMessage}</p>
                <button
                  type="button"
                  onClick={onReconsentSheets}
                  disabled={isLoggingIn}
                  className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-lg bg-[#97F017] hover:bg-[#8CE615] text-[#0B0D12] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Berikan Izin Google Sheets
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sub-menu 2: Akun */}
        {activeTab === 'account' && (
          <div className="pt-6">
            <div className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5 sm:p-6">
              {profile ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName || 'Foto profil Google'}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#97F017] text-[#0B0D12] font-bold text-lg flex items-center justify-center shrink-0">
                        {(profile.displayName?.[0] || profile.email?.[0] || 'G').toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="text-base font-bold text-white truncate">
                        {profile.displayName || 'Pengguna Google'}
                      </div>
                      <div className="text-xs text-slate-400 break-all">
                        {profile.email}
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#97F017] pt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {hasToken
                            ? 'Login tersimpan · Akses Google Sheets aktif'
                            : 'Login tersimpan otomatis (siap lanjut tanpa login ulang)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {!hasToken && (
                      <button
                        type="button"
                        onClick={onGoogleLogin}
                        disabled={isLoggingIn}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#97F017] hover:bg-[#8CE615] text-xs font-bold text-[#0B0D12] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isLoggingIn ? 'Menghubungkan...' : 'Aktifkan Sinkronisasi'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onSwitchAccount}
                      disabled={isLoggingIn}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Ganti Akun
                    </button>
                    <button
                      type="button"
                      onClick={onGoogleLogout}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 text-xs font-semibold text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div className="space-y-1.5">
                    <h3 className="font-display text-base font-bold text-white">
                      Akun Google Belum Terhubung
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                      Masuk dengan akun Google Anda sekali saja; sesi akun akan tersimpan agar Anda
                      tidak perlu login ulang saat membuka kembali aplikasi.
                    </p>
                  </div>

                  <GoogleSignInButton
                    isLoggingIn={isLoggingIn}
                    onClick={onGoogleLogin}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-menu 3: Personalisasi */}
        {activeTab === 'personalization' && (
          <div className="pt-6">
            <form
              onSubmit={handleSaveBrand}
              className="rounded-2xl bg-[#0E1117] border border-white/[0.06] p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Personalisasi Nama Aplikasi & Usaha
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ubah nama tampilan utama di header, judul tab browser, dan laporan PDF sesuai nama toko atau usaha Anda.
                  </p>
                </div>

                {/* Live Preview */}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#161920] border border-white/10 self-start sm:self-auto shrink-0">
                  <span
                    aria-hidden="true"
                    className="w-7 h-7 rounded-lg bg-[#97F017] text-[#0B0D12] flex items-center justify-center font-extrabold text-sm"
                  >
                    {previewLetter}
                  </span>
                  <span className="font-display text-sm font-bold text-white max-w-[160px] truncate">
                    {draftBrand.trim() || 'KasBuku'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-7">
                  <label
                    htmlFor="brand-name-input"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Nama Tampilan (Contoh: HansStore)
                  </label>
                  <input
                    id="brand-name-input"
                    type="text"
                    maxLength={32}
                    value={draftBrand}
                    onChange={(e) => {
                      setBrandError('');
                      setDraftBrand(e.target.value);
                    }}
                    placeholder="Contoh: HansStore"
                    className="w-full min-h-[44px] rounded-xl bg-[#161920] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#97F017] transition-colors"
                  />
                </div>

                <div className="md:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#97F017] hover:bg-[#8CE615] text-[#0B0D12] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Simpan Nama
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBrand}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset KasBuku</span>
                  </button>
                </div>
              </div>

              {brandError && (
                <p role="alert" className="text-xs font-medium text-rose-400">
                  {brandError}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
