// TopBar renders brand wordmark, primary nav links, and saved Google account chip or Sign-In button

interface TopBarProfile {
  email: string;
  displayName: string;
  photoURL: string;
}

interface TopBarProps {
  brandName: string;
  profile: TopBarProfile | null;
  isLoggingIn: boolean;
  onGoogleLogin: () => void;
  onOpenAccount: () => void;
}

export function TopBar({
  brandName,
  profile,
  isLoggingIn,
  onGoogleLogin,
  onOpenAccount,
}: TopBarProps) {
  const displayBrand = brandName.trim() || 'KasBuku';
  const monogram = displayBrand[0].toUpperCase();

  return (
    <header className="w-full border-b border-white/[0.07] bg-[#0B0D12]/90 backdrop-blur-md md:sticky md:top-0 z-30">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#ringkasan"
          className="font-display text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[175px] sm:max-w-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#97F017]"
        >
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-lg bg-[#97F017] text-[#0B0D12] flex items-center justify-center font-extrabold text-sm shrink-0"
          >
            {monogram}
          </span>
          <span className="truncate">{displayBrand}</span>
        </a>

        {/* Zone 2: Clean single-line nav links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
        >
          <a
            href="#ringkasan"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Ringkasan
          </a>
          <a
            href="#grafik"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Grafik
          </a>
          <a
            href="#tabel-transaksi"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Tabel Transaksi
          </a>
          <a
            href="#lainnya"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Lainnya
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {profile ? (
            <a
              href="#lainnya"
              onClick={onOpenAccount}
              title={`Akun tersimpan: ${profile.email}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[40px] rounded-full bg-[#161920] hover:bg-[#1F242E] border border-white/10 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'Pengguna Google'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#97F017] text-[#0B0D12] font-bold flex items-center justify-center text-[11px] shrink-0">
                  {(profile.displayName?.[0] || profile.email?.[0] || 'G').toUpperCase()}
                </span>
              )}
              <span className="max-w-[120px] sm:max-w-[155px] truncate">
                {profile.displayName || profile.email}
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button"
              aria-label="Sign in with Google"
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
          )}
        </div>
      </div>
    </header>
  );
}
