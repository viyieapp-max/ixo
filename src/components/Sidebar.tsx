import {
  BarChart3,
  LogIn,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Table2,
  UserCircle2,
} from 'lucide-react';
import type { MainNavKey } from '../types/finance';

export interface SidebarProfile {
  email: string;
  displayName: string;
  photoURL: string;
}

interface SidebarProps {
  brandName: string;
  activeMenu: MainNavKey;
  collapsed: boolean;
  isAuthenticated: boolean;
  profile: SidebarProfile | null;
  onSelectMenu: (menu: MainNavKey) => void;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: Array<{
  id: MainNavKey;
  label: string;
  icon: typeof BarChart3;
}> = [
  { id: 'grafik', label: 'Grafik', icon: BarChart3 },
  { id: 'tabel', label: 'Tabel Keuangan', icon: Table2 },
  { id: 'akun', label: 'Akun', icon: UserCircle2 },
  { id: 'personalisasi', label: 'Personalisasi', icon: Palette },
];

export function Sidebar({
  brandName,
  activeMenu,
  collapsed,
  profile,
  onSelectMenu,
  onToggleCollapse,
}: SidebarProps) {
  const displayBrand = brandName.trim() || 'KasBuku';
  const monogram = displayBrand[0].toUpperCase();

  return (
    <aside
      aria-label="Menu navigasi kiri"
      data-collapsed={collapsed ? 'true' : 'false'}
      className={`hidden md:flex flex-col sticky top-0 h-dvh shrink-0 bg-[#150A0B] border-r border-[#EFF8FF]/[0.08] transition-[width] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] select-none z-30 ${
        collapsed ? 'w-[76px]' : 'w-[244px]'
      }`}
    >
      {/* Top Brand & Collapse Toggle */}
      <div
        className={`border-b border-[#EFF8FF]/[0.07] ${
          collapsed
            ? 'px-2.5 py-3.5 flex flex-col items-center gap-2.5'
            : 'px-4 h-16 flex items-center justify-between gap-2'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectMenu('grafik')}
          title={displayBrand}
          aria-label={displayBrand}
          className={`flex items-center gap-2.5 min-w-0 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BBEF1F] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-xl bg-[#BBEF1F] text-[#0D0303] flex items-center justify-center font-display font-extrabold text-sm shrink-0"
          >
            {monogram}
          </span>
          {!collapsed && (
            <span className="font-display text-base font-bold tracking-tight text-[#EFF8FF] truncate">
              {displayBrand}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? 'Perluas tab kiri' : 'Perkecil tab kiri menjadi ikon'
          }
          title={collapsed ? 'Perluas menu' : 'Perkecil ke ikon'}
          className="w-9 h-9 rounded-xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/10 text-[#EFF8FF]/80 hover:text-[#EFF8FF] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Navigasi utama"
        className={`flex-1 py-4 space-y-1.5 overflow-y-auto ${
          collapsed ? 'px-2.5' : 'px-3'
        }`}
      >
        {!collapsed && (
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#EFF8FF]/45">
            Menu Utama
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMenu(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              className={`w-full min-h-[44px] rounded-xl flex items-center transition-colors cursor-pointer ${
                collapsed
                  ? 'justify-center px-0'
                  : 'justify-start gap-3 px-3.5'
              } ${
                isActive
                  ? 'bg-[#BBEF1F] text-[#0D0303] font-bold shadow-sm'
                  : 'text-[#EFF8FF]/70 hover:text-[#EFF8FF] hover:bg-[#EFF8FF]/[0.05] font-medium'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Account Card */}
      <div
        className={`border-t border-[#EFF8FF]/[0.07] ${
          collapsed ? 'p-2.5 flex justify-center' : 'p-3'
        }`}
      >
        {profile ? (
          <button
            type="button"
            onClick={() => onSelectMenu('akun')}
            title={`Akun: ${profile.displayName || profile.email}`}
            aria-label={`Akun: ${profile.displayName || profile.email}`}
            className={`w-full rounded-xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/10 transition-colors cursor-pointer flex items-center ${
              collapsed ? 'justify-center p-2 min-h-[44px]' : 'gap-2.5 p-2.5'
            }`}
          >
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName || 'Pengguna Google'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-[#BBEF1F] text-[#0D0303] font-bold flex items-center justify-center text-xs shrink-0">
                {(profile.displayName?.[0] || profile.email?.[0] || 'G').toUpperCase()}
              </span>
            )}
            {!collapsed && (
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold text-[#EFF8FF] truncate">
                  {profile.displayName || 'Pengguna Google'}
                </div>
                <div className="text-[11px] text-[#EFF8FF]/55 truncate">
                  {profile.email}
                </div>
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectMenu('akun')}
            title="Masuk dengan Akun Google"
            aria-label="Masuk dengan Akun Google"
            className={`w-full min-h-[44px] rounded-xl bg-[#1E1012] hover:bg-[#291619] border border-[#EFF8FF]/12 text-[#EFF8FF] transition-colors cursor-pointer flex items-center ${
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'
            }`}
          >
            <LogIn className="w-4 h-4 text-[#BBEF1F] shrink-0" aria-hidden="true" />
            {!collapsed && (
              <span className="text-xs font-semibold truncate">
                Masuk Akun Google
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
