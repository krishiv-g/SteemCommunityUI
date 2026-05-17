import { Link } from 'react-router-dom';
import { Search, Bell, PenSquare, Moon, Sun, LogIn, LogOut, Settings, Bookmark, Wallet } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { MemberSearch } from '@/components/MemberSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { currentUser, logout } = useAppStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border h-14 flex items-center"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group select-none shrink-0">
          <AppLogo className="h-7 w-7" />
          <span className="font-heading text-base font-bold hidden sm:block">
            <span className="text-primary">Steem</span>
            <span className="text-foreground">Dev</span>
          </span>
        </Link>

        {/* Center: Member search — desktop */}
        <div className="hidden sm:block flex-1 max-w-xl mx-auto">
          <MemberSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile: search icon toggles inline search */}
          {mobileSearchOpen ? (
            <div className="sm:hidden flex-1 mr-1">
              <MemberSearch autoFocus onClose={() => setMobileSearchOpen(false)} />
            </div>
          ) : (
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="sm:hidden p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Theme toggle — hidden on mobile (it's in the mobile sidebar More menu) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {currentUser ? (
            <>
              <Link
                to="/write"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <PenSquare className="h-3.5 w-3.5" />
                Write
              </Link>

              <Link
                to="/notifications"
                className="relative p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none ml-1" asChild>
                  <button className="rounded-full ring-2 ring-border hover:ring-primary/50 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pb-1">
                    <span className="font-mono text-foreground">@{currentUser.username}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/user/${currentUser.username}`} className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer">
                      <Bell className="h-4 w-4 mr-2" /> Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved" className="cursor-pointer">
                      <Bookmark className="h-4 w-4 mr-2" /> Saved
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="cursor-pointer">
                      <Wallet className="h-4 w-4 mr-2" /> Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Sign In</span>
              <span className="xs:hidden sr-only">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
