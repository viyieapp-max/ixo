// Mobile-only top header displaying brand wordmark and saved Google account chip or Sign-In button

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
  onOpenGrafik: () => void;
  onOpenAccount: () => void;
}

export function TopBar({
  brandName,
  profile,
  isLoggingIn,
  onGoogleLogin,
  onOpenGrafik,
  onOpenAccount,
}: TopBarProps) {
  const displayBrand = brandName.trim() || 'KasBuku';
  const monogram = displayBrand[0].toUpperCase();

  return (
    <header className="md:hidden w-full border-b border-[#EFF8FF]/[0.08] bg-[#0D0303]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenGrafik}
          className="font-display text-base font-bold tracking-tight text-[#EFF8FF] whitespace-nowrap shrink-0 flex items-center gap-2 min-w-0 max-w-[175px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BBEF1F]"
        >
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-lg bg-[#BBEF1F] text-[#0D0303] flex items-center justify-center font-extrabold text-sm shrink-0"
          >
            {monogram}
          </span>
          <span className="truncate">{displayBrand}</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {profile ? (
            <button
              type="button"
              onClick={onOpenAccount}
              title={`Akun tersimpan: ${profile.email}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[40px] rounded-full bg-[#150A0B] hover:bg-[#1E1012] border border-[#EFF8FF]/12 text-xs font-medium text-[#EFF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'Pengguna Google'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#BBEF1F] text-[#0D0303] font-bold flex items-center justify-center text-[11px] shrink-0">
                  {(profile.displayName?.[0] || profile.email?.[0] || 'G').toUpperCase()}
                </span>
              )}
              <span className="max-w-[120px] truncate">
                {profile.displayName || profile.email}
              </span>
            </button>
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
