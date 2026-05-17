import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RoleBadge } from '@/components/RoleBadge';
import { fetchCommunitySubscribers, type CommunitySubscriber } from '@/services/steem.community';
import { fetchAccounts, type SteemProfile } from '@/services/steem.accounts';
import { getAvatarUrl } from '@/services/avatar';
import { Users } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<(CommunitySubscriber & { profile?: SteemProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunitySubscribers().then(async (subs) => {
      const profiles = await fetchAccounts(subs.map(s => s.account));
      const profileMap = new Map(profiles.map(p => [p.account, p]));
      setMembers(subs.map(s => ({ ...s, profile: profileMap.get(s.account) })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            Community Members
          </h1>
          {!loading && members.length > 0 && (
            <span className="text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-mono">
              {members.length}
            </span>
          )}
        </div>

        {!loading && members.length >= 250 && (
          <p className="text-xs text-muted-foreground">Showing latest 250 active members</p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-card border border-border p-4 space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted mx-auto" />
                <div className="h-3.5 w-20 bg-muted rounded mx-auto" />
                <div className="h-3 w-14 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {members.map(m => (
              <Link
                key={m.account}
                to={`/user/${m.account}`}
                className="group rounded-xl bg-card border border-border hover:border-primary/30 p-4 text-center space-y-2.5 transition-all hover:shadow-elevated"
              >
                <img
                  src={getAvatarUrl(m.account)}
                  alt=""
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full mx-auto object-cover group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                />
                <div>
                  <p className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {m.profile?.name || m.account}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">@{m.account}</p>
                  {m.profile?.reputation != null && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">Rep: {m.profile.reputation}</p>
                  )}
                </div>
                {(m.title || m.role !== 'guest') && (
                  <div className="flex justify-center">
                    <RoleBadge title={m.title || m.role} role={m.role} />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(m.subscribedAt + 'Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        )}

        {!loading && members.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No members found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
