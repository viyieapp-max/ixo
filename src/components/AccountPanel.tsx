import { LogOut, ShieldCheck, UserCircle2 } from 'lucide-react';

export interface AccountProfileView {
  email: string;
  displayName: string;
  photoURL: string;
}

interface AccountPanelProps {
  profile: AccountProfileView | null;
  isLoggingIn: boolean;
  authError: string | null;
  onGoogleLogin: () => void;
  onSwitchAccount: () => void;
  onGoogleLogout: () => void;
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

export function AccountPanel({
  profile,
  isLoggingIn,
  authError,
  onGoogleLogin,
  onSwitchAccount,
  onGoogleLogout,
}: AccountPanelProps) {
  return (
    <section
      aria-label="Pengaturan Akun Google"
      className="max-w-[1380px] mx-auto px-4 sm:px-8 pt-5 sm:pt-7 pb-10 sm:pb-14"
    >
      <div className="mb-5 sm:mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#BBEF1F] mb-1.5">
          <UserCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>Akun Pengguna</span>
        </div>
        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#EFF8FF]">
          Akun & Sesi Login
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#EFF8FF]/65">
          Masuk dengan Akun Google Anda untuk membuka seluruh fitur pembukuan dan saldo.
        </p>
      </div>

      <div className="rounded-3xl sm:rounded-[28px] bg-[#150A0B] border border-[#EFF8FF]/[0.08] p-5 sm:p-8 space-y-5">
        <div className="rounded-2xl bg-[#0D0303] border border-[#EFF8FF]/[0.08] p-5 sm:p-6">
          {profile ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'Foto profil Google'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-[#EFF8FF]/15"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[#BBEF1F] text-[#0D0303] font-bold text-lg flex items-center justify-center shrink-0">
                    {(profile.displayName?.[0] || profile.email?.[0] || 'G').toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <div className="text-base font-bold text-[#EFF8FF] truncate">
                    {profile.displayName || 'Pengguna Google'}
                  </div>
                  <div className="text-xs text-[#EFF8FF]/65 break-all">
                    {profile.email}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#BBEF1F] pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Login tersimpan otomatis · Semua fitur aktif</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={onSwitchAccount}
                  disabled={isLoggingIn}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/10 text-xs font-semibold text-[#EFF8FF] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Ganti Akun
                </button>
                <button
                  type="button"
                  onClick={onGoogleLogout}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF0055]/15 hover:bg-[#FF0055]/25 border border-[#FF0055]/35 text-xs font-semibold text-[#FF0055] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="space-y-1.5">
                <h2 className="font-display text-base font-bold text-[#EFF8FF]">
                  Akun Google Belum Terhubung
                </h2>
                <p className="text-xs text-[#EFF8FF]/65 max-w-xl leading-relaxed">
                  Masuk dengan akun Google Anda sekali saja; sesi akun akan tersimpan agar Anda
                  tidak perlu login ulang dan dapat langsung menggunakan semua fitur.
                </p>
              </div>

              <GoogleSignInButton
                isLoggingIn={isLoggingIn}
                onClick={onGoogleLogin}
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#0D0303] border border-[#EFF8FF]/[0.08] px-5 py-4 text-xs text-[#EFF8FF]/70 leading-relaxed">
          Catatan keamanan: sebelum login atau setelah memilih{' '}
          <strong className="text-[#FF0055]">Keluar</strong>, saldo selalu terkunci di{' '}
          <strong className="font-mono-nums text-[#EFF8FF]">Rp0</strong> dan seluruh fitur
          pembukuan terkunci hingga Anda masuk kembali.
        </div>

        {authError && (
          <div
            role="alert"
            className="rounded-xl bg-[#FF0055]/15 border border-[#FF0055]/35 px-4 py-3 text-xs font-medium text-[#EFF8FF]"
          >
            {authError}
          </div>
        )}
      </div>
    </section>
  );
}
