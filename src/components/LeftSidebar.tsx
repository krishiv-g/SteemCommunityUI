import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, BarChart3, Hash } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const communityNav = [
  { to: '/community', label: 'Community', icon: Users },
  { to: '/forums', label: 'Forums', icon: MessageSquare },
  { to: '/polls', label: 'Polls', icon: BarChart3 },
];


const FALLBACK_TAGS = [
  'dapp', 'steem', 'development', 'blockchain', 'steemdev',
  'programming', 'ai', 'mobile', 'coding', 'webdev',
];

// ── Module-level singleton: fetch once, never re-fetch ──────────────────────
let cachedTags: string[] = FALLBACK_TAGS;
let listeners: (() => void)[] = [];
let fetched = false;

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}
function getSnapshot() { return cachedTags; }

function initTagFetch() {
  if (fetched) return;
  fetched = true;
  fetch('/api/tags')
    .then(r => r.ok ? r.json() : null)
    .then((data: string[] | null) => {
      if (data && data.length > 0) {
        cachedTags = data.slice(0, 10);
        listeners.forEach(l => l());
      }
    })
    .catch(() => {});
}

initTagFetch();
// ────────────────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className = '' }: LeftSidebarProps) {
  const location = useLocation();
  const tags = useSyncExternalStore(subscribe, getSnapshot);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/' && !location.search;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <aside className={`flex flex-col h-full overflow-y-auto ${className}`}>
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {/* Home */}
        <SidebarSection label="Feed">
          <SidebarLink to="/" label="Home" icon={Home} active={location.pathname === '/' && !location.search} />
        </SidebarSection>

        {/* Community */}
        <SidebarSection label="Community">
          {communityNav.map(item => (
            <SidebarLink key={item.to} to={item.to} label={item.label} icon={item.icon} active={isActive(item.to)} />
          ))}
        </SidebarSection>

        {/* Tags */}
        <SidebarSection label="Explore Tags">
          {tags.map(tag => (
            <Link
              key={tag}
              to={`/tag/${tag}`}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                location.pathname === `/tag/${tag}`
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono">{tag}</span>
            </Link>
          ))}
        </SidebarSection>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          © 2025 SteemDev<br />
          Powered by Steem blockchain
        </p>
      </div>
    </aside>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-2">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 ${
        active
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
