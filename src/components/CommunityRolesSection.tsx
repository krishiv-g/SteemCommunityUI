import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommunityRoles, type CommunityTeamMember } from '@/services/steem.community';
import { fetchAccounts, type SteemProfile } from '@/services/steem.accounts';
import { getAvatarUrl } from '@/services/avatar';
import { Shield } from 'lucide-react';

const ROLE_ORDER = ['admin', 'mod'] as const;

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admins', icon: Shield, color: 'text-primary' },
  mod: { label: 'Moderators', icon: Shield, color: 'text-secondary' },
};

export function CommunityRolesSection() {
  const [roles, setRoles] = useState<CommunityTeamMember[]>([]);
  const [profiles, setProfiles] = useState<Map<string, SteemProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>('admin');

  useEffect(() => {
    fetchCommunityRoles()
      .then((data) => {
        setRoles(data);
        // Fetch profiles for non-muted users (limit to keep it fast)
        const nonMuted = data.filter((r) => r.role !== 'muted').map((r) => r.account);
        if (nonMuted.length > 0) {
          fetchAccounts(nonMuted.slice(0, 50)).then((profs) => {
            const map = new Map<string, SteemProfile>();
            profs.forEach((p) => map.set(p.account, p));
            setProfiles(map);
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-card shadow-soft p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (roles.length === 0) return null;

  const grouped = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = roles.filter((r) => r.role === role);
    return acc;
  }, {} as Record<string, CommunityTeamMember[]>);

  return (
    <section className="rounded-xl bg-card shadow-soft p-5 space-y-4">
      <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" /> Community Roles
      </h2>

      <div className="space-y-2">
        {ROLE_ORDER.map((roleKey) => {
          const members = grouped[roleKey];
          if (!members || members.length === 0) return null;
          const config = ROLE_CONFIG[roleKey];
          const Icon = config.icon;
          const isExpanded = expandedRole === roleKey;

          return (
            <div key={roleKey} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedRole(isExpanded ? null : roleKey)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-sm">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  {config.label}
                  <span className="text-xs text-muted-foreground">({members.length})</span>
                </span>
                <span className="text-xs text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {members.map((m) => {
                      const profile = profiles.get(m.account);
                      return (
                        <Link
                          key={m.account}
                          to={`/user/${m.account}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <img
                            src={getAvatarUrl(m.account)}
                            alt={m.account}
                            className="h-9 w-9 rounded-full border-2 border-accent object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground truncate">
                              @{m.account}
                            </p>
                            {m.title && (
                              <p className="text-xs text-muted-foreground truncate">{m.title}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
