import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, BarChart3, PenSquare, Bell, Bookmark, Wallet, Menu, LogIn, LogOut, Moon, Sun, Settings, Hash, MoreHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { AppLogo } from '@/components/AppLogo';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from 'next-themes';
import { useState } from 'react';

const mainNav = [
  { to: '/', label: 'Home', icon: Home },
];

const communityNav = [
  { to: '/community', label: 'Community', icon: Users },
  { to: '/forums', label: 'Forums', icon: MessageSquare },
  { to: '/polls', label: 'Polls', icon: BarChart3 },
];

const accountNav = [
  { to: '/write', label: 'Write Post', icon: PenSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const devTags = ['programming', 'python', 'javascript', 'webdev', 'rust', 'blockchain', 'ai', 'tutorial'];

interface MobileSidebarProps {
  asBottomTab?: boolean;
}

export function MobileSidebar({ asBottomTab = false }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAppStore();
  const { theme, setTheme } = useTheme();

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/' && !location.search;
    return location.pathname + location.search === to || location.pathname === to;
  };

  const NavLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 mx-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
        isActive(to)
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );

  const trigger = asBottomTab ? (
    <button
      className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      aria-label="More"
    >
      <MoreHorizontal className="h-5 w-5" />
      <span className="text-[10px] font-medium">More</span>
    </button>
  ) : (
    <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden" aria-label="Open menu">
      <Menu className="h-5 w-5" />
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 border-r border-border bg-card">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
            <AppLogo className="h-7 w-7" />
            <span className="font-heading text-base font-bold">
              <span className="text-primary">Steem</span>
              <span className="text-foreground">Dev</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 space-y-0">

            <SectionLabel>Feed</SectionLabel>
            {mainNav.map(item => <NavLink key={item.to} {...item} />)}

            <SectionLabel className="mt-3">Community</SectionLabel>
            {communityNav.map(item => <NavLink key={item.to} {...item} />)}

            {currentUser && (
              <>
                <SectionLabel className="mt-3">Account</SectionLabel>
                {accountNav.map(item => <NavLink key={item.to} {...item} />)}
              </>
            )}

            <SectionLabel className="mt-3">Tags</SectionLabel>
            {devTags.map(tag => (
              <Link
                key={tag}
                to={`/tag/${tag}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 mx-1 px-3 py-2 rounded-md text-sm transition-all ${
                  location.pathname === `/tag/${tag}`
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="font-mono">{tag}</span>
              </Link>
            ))}

            <SectionLabel className="mt-3">Appearance</SectionLabel>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 mx-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all w-[calc(100%-8px)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </nav>

          {/* User footer */}
          <div className="border-t border-border shrink-0">
            {currentUser ? (
              <>
                <Link
                  to={`/user/${currentUser.username}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground font-mono truncate">@{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {currentUser.loginMethod === 'keychain' ? 'Keychain login' : 'Posting key'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-muted/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="p-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In to SteemDev
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 ${className}`}>
      {children}
    </p>
  );
}
