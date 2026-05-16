import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, BarChart3, PenSquare, Bell, Bookmark, Wallet, Menu, LogIn, LogOut, Moon, Sun, Settings, MessagesSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { HempLogo } from '@/components/HempLogo';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from 'next-themes';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/forums', label: 'Forums', icon: MessageSquare },
  { to: '/polls', label: 'Polls', icon: BarChart3 },
  { to: '/chat', label: 'Chat', icon: MessagesSquare },
];

const userItems = [
  { to: '/write', label: 'Write Post', icon: PenSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAppStore();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 border-none">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 p-4">
            <HempLogo className="h-7 w-7" />
            <span className="font-heading text-xl font-bold text-primary">World of Xpilar</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 py-2 overflow-y-auto">
            <div className="px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Menu</span>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            {currentUser && (
              <>
                <div className="px-3 py-2 mt-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</span>
                </div>
                {userItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.to)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            {/* Theme Toggle */}
            <div className="px-3 py-2 mt-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appearance</span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </nav>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="pt-2">
              <Link
                to={`/user/${currentUser.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
              >
                <img src={currentUser.avatar} alt="" className="h-9 w-9 rounded-full border-2 border-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">@{currentUser.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentUser.loginMethod === 'keychain' ? 'Keychain' : 'Posting Key'}</p>
                </div>
              </Link>
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="p-3">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
