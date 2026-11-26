import { BarChart3, Palette, Table2, UserCircle2 } from 'lucide-react';
import type { MainNavKey } from '../types/finance';

interface MobileBottomNavProps {
  activeMenu: MainNavKey;
  onSelectMenu: (menu: MainNavKey) => void;
}

export function MobileBottomNav({
  activeMenu,
  onSelectMenu,
}: MobileBottomNavProps) {
  const items: Array<{
    id: MainNavKey;
    label: string;
    icon: typeof BarChart3;
  }> = [
    { id: 'grafik', label: 'Grafik', icon: BarChart3 },
    { id: 'tabel', label: 'Tabel', icon: Table2 },
    { id: 'akun', label: 'Akun', icon: UserCircle2 },
    { id: 'personalisasi', label: 'Personalisasi', icon: Palette },
  ];

  return (
    <nav
      aria-label="Navigasi seluler"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden h-14 bg-[#150A0B]/95 backdrop-blur-md border-t border-[#EFF8FF]/10 px-2"
    >
      <div className="grid grid-cols-4 h-full max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeMenu === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMenu(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'text-[#BBEF1F] font-semibold'
                  : 'text-[#EFF8FF]/60 hover:text-[#EFF8FF]'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
