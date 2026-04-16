import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Sparkles,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/projects', label: 'Proyectos', Icon: FolderKanban },
  { href: '/insights', label: 'Insights', Icon: Sparkles },
  { href: '/clients', label: 'Clientes', Icon: Users },
  { href: '/invoices', label: 'Facturas', Icon: FileText },
  { href: '/account', label: 'Cuenta', Icon: User },
];

export default function MobileNav() {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden">
      <div className="flex justify-around items-center h-16 px-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = currentPath === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[9px] font-semibold leading-tight ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
