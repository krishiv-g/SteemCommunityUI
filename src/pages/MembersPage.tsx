import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RoleBadge } from '@/components/RoleBadge';
import { fetchCommunitySubscribers, type CommunitySubscriber } from '@/services/steem.community';
import { fetchAccounts, type SteemProfile } from '@/services/steem.accounts';
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
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Community Members
          <span className="text-sm font-normal text-muted-foreground ml-2">({members.length})</span>
        </h1>
        {!loading && members.length >= 250 && (
          <p className="text-sm text-muted-foreground">Showing latest 250 active members only</p>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-card shadow-soft p-5 space-y-3">
                <div className="h-14 w-14 rounded-full bg-muted mx-auto" />
                <div className="h-4 w-24 bg-muted rounded mx-auto" />
                <div className="h-3 w-16 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => (
              <div key={m.account} className="rounded-xl bg-card shadow-soft p-5 text-center space-y-3">
                <Link to={`/user/${m.account}`}>
                  <img
                    src={m.profile?.profileImage || `https://steemitimages.com/u/${m.account}/avatar`}
                    alt=""
                    className="h-14 w-14 rounded-full mx-auto border-2 border-accent"
                  />
                </Link>
                <div>
                  <Link to={`/user/${m.account}`} className="font-heading font-bold text-card-foreground hover:text-primary transition-colors">
                    {m.profile?.name || m.account}
                  </Link>
                  <p className="text-sm text-muted-foreground">@{m.account}</p>
                  <p className="text-xs text-muted-foreground">Rep: {m.profile?.reputation ?? '–'}</p>
                </div>
                <div className="flex justify-center">
                  {m.title ? (
                    <RoleBadge title={m.title} role={m.role} />
                  ) : m.role !== 'guest' ? (
                    <RoleBadge title={m.role} role={m.role} />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(m.subscribedAt + 'Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
