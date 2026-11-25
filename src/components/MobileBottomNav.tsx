import { BarChart3, LayoutDashboard, SlidersHorizontal, Table2 } from 'lucide-react';

export function MobileBottomNav() {
  const items = [
    { href: '#ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '#grafik', label: 'Grafik', icon: BarChart3 },
    { href: '#tabel-transaksi', label: 'Tabel', icon: Table2 },
    { href: '#lainnya', label: 'Lainnya', icon: SlidersHorizontal },
  ];

  return (
    <nav
      aria-label="Navigasi seluler"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden h-14 bg-[#0E1117]/95 backdrop-blur-md border-t border-white/10 px-2"
    >
      <div className="grid grid-cols-4 h-full max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-300 hover:text-[#97F017] active:text-[#97F017] transition-colors whitespace-nowrap"
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
