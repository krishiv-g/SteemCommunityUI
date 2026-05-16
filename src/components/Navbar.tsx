import { Link } from 'react-router-dom';
import { Search, Bell, Bookmark, PenSquare, Wallet, Moon, Sun, LogIn, LogOut, Settings, MessageSquare } from 'lucide-react';
import { HempLogo } from '@/components/HempLogo';
import { MobileSidebar } from '@/components/MobileSidebar';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from 'next-themes';
import { useState } from 'react';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 shrink-0">
          <MobileSidebar />
          <Link to="/" className="flex items-center gap-2 group">
            <HempLogo className="h-7 w-7 transition-transform group-hover:rotate-12" />
            <span className="font-heading text-xl font-bold text-primary">World of Xpilar</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          <NavItem to="/" label="Home" />
          <NavItem to="/community" label="Community" />
          <NavItem to="/forums" label="Forums" />
          <NavItem to="/polls" label="Polls" />
          <NavItem to="/chat" label="Chat" />
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {currentUser ? (
            <>
              <Link to="/write" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <PenSquare className="h-4 w-4" />
                Write
              </Link>
              <Link to="/notifications" className="hidden md:block p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-secondary" />
              </Link>
              <Link to="/saved" className="hidden md:block p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Bookmark className="h-5 w-5" />
              </Link>
              <Link to="/wallet" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:block">
                <Wallet className="h-5 w-5" />
              </Link>

              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger className="ml-1 focus:outline-none">
                    <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full border-2 border-accent" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Signed in as @{currentUser.username}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/user/${currentUser.username}`} className="cursor-pointer">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="container pb-4">
          <input
            type="text"
            placeholder="Search posts, tags, or authors..."
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
        </div>
      )}
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {label}
    </Link>
  );
}
