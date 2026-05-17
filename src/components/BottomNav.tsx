import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PenSquare, BarChart3, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function BottomNav() {
  const location = useLocation();
  const { currentUser } = useAppStore();

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/' && !location.search;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/community', label: 'Community', icon: Users },
    { to: '/forums', label: 'Forums', icon: MessageSquare },
    { to: '/polls', label: 'Polls', icon: BarChart3 },
    ...(currentUser ? [{ to: '/write', label: 'Write', icon: PenSquare }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch h-14">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px] ${
              isActive(to)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`h-5 w-5 transition-transform ${isActive(to) ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
