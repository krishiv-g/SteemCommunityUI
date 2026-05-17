import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AuthorCard } from '@/components/AuthorCard';
import { AppLogo } from '@/components/AppLogo';
import { CommunityRolesSection } from '@/components/CommunityRolesSection';
import { api } from '@/services';
import { fetchCommunity, fetchCommunityTeam, type CommunityTeamMember } from '@/services/steem.community';
import { fetchAccounts, type SteemProfile } from '@/services/steem.accounts';
import { getAvatarUrl } from '@/services/avatar';
import { fetchPinnedPosts } from '@/services/steem.posts';
import type { Post, Community as CommunityType, User } from '@/services/api.interface';
import { Users, DollarSign, TrendingUp, PenTool, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CommunityPage() {
  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [team, setTeam] = useState<CommunityTeamMember[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<SteemProfile[]>([]);
  const [ownerAccount, setOwnerAccount] = useState<string | null>(null);
  const [showAllLeaders, setShowAllLeaders] = useState(false);
  
  const [members, setMembers] = useState<User[]>([]);
  const [pinnedAuthors, setPinnedAuthors] = useState<SteemProfile[]>([]);
  const [authorTitles, setAuthorTitles] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunity()
      .then(setCommunity)
      .catch((err) => {
        console.error('Failed to fetch community from RPC:', err);
        setError('Could not load community from chain. Showing cached data.');
        api.getCommunity().then(setCommunity);
      });

    fetchCommunityTeam()
      .then((t) => {
        setTeam(t);
        const owner = t.find((m) => m.role === 'owner');
        if (owner) setOwnerAccount(owner.account);

        // Fetch real profiles for non-owner leadership
        const leadership = t.filter((m) => m.role !== 'owner');
        if (leadership.length > 0) {
          const usernames = leadership.map((m) => m.account);
          fetchAccounts(usernames)
            .then(setTeamProfiles)
            .catch(() => {});
        }
      })
      .catch(() => {});

    api.getCommunityMembers().then(setMembers);

    // Fetch pinned posts and find top 4 authors by pin count
    fetchPinnedPosts().then(async (pinned) => {
      const countMap = new Map<string, number>();
      const titleMap = new Map<string, string>();
      pinned.forEach((p) => {
        countMap.set(p.author.username, (countMap.get(p.author.username) || 0) + 1);
        if (p.author.communityTitle && !titleMap.has(p.author.username)) {
          titleMap.set(p.author.username, p.author.communityTitle);
        }
      });
      const sorted = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
      const usernames = sorted.map(([u]) => u);
      if (usernames.length > 0) {
        const profiles = await fetchAccounts(usernames);
        const profileMap = new Map(profiles.map((p) => [p.account, p]));
        setPinnedAuthors(usernames.map((u) => profileMap.get(u)!).filter(Boolean));
        setAuthorTitles(titleMap);
      }
    }).catch(() => {});
  }, []);

  if (!community) return <Layout><div className="reading-width py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  

  // Build a map of role by account for the leadership
  const roleMap = new Map(team.filter((t) => t.role !== 'owner').map((t) => [t.account, t]));

  return (
    <Layout>
      <div className="space-y-10">
        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm text-center">{error}</div>
        )}
        {/* Header */}
        <div className="rounded-xl bg-card shadow-soft p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <AppLogo className="h-12 w-12" />
              <h1 className="font-heading text-4xl font-bold text-foreground">{community.title}</h1>
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">{community.description}</p>
            <div className="flex justify-center gap-8 text-sm">
              <Link to="/community/members" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Users className="h-4 w-4 text-secondary" /> <strong>{community.members}</strong> members</Link>
              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-secondary" /> <strong>{community.pendingRewards}</strong> pending</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-secondary" /> <strong>{community.activePosters}</strong> active</span>
            </div>
            {ownerAccount && (
              <p className="text-sm text-muted-foreground">
                Community Steem Account: <Link to={`/user/${ownerAccount}`} className="text-primary hover:underline font-medium">@{ownerAccount}</Link>
              </p>
            )}
          </div>

          {teamProfiles.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" /> Leadership
                </h2>
                {(() => {
                  // 2 rows: 6 on lg (3 cols), 4 on sm (2 cols), 2 on mobile (1 col) — use 6 as default limit
                  const limit = 6;
                  const visible = showAllLeaders ? teamProfiles : teamProfiles.slice(0, limit);
                  const hasMore = teamProfiles.length > limit;
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visible.map((profile) => {
                          const teamMember = roleMap.get(profile.account);
                          return (
                            <Link
                              key={profile.account}
                              to={`/user/${profile.account}`}
                              className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-muted transition-colors gap-3"
                            >
                              <img
                                src={getAvatarUrl(profile.account)}
                                alt={profile.name}
                                className="h-16 w-16 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="w-full space-y-1">
                                <p className="font-bold text-sm text-foreground break-words">{profile.name}</p>
                                <p className="text-xs text-foreground/70">@{profile.account}</p>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium capitalize">
                                    {teamMember?.role || 'member'}
                                  </span>
                                </div>
                                {profile.about && (
                                  <p className="text-xs text-foreground/60 mt-2 whitespace-pre-line">{profile.about}</p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      {hasMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 w-full text-primary"
                          onClick={() => setShowAllLeaders(!showAllLeaders)}
                        >
                          {showAllLeaders ? (
                            <><ChevronUp className="h-4 w-4 mr-1" /> Show Less</>
                          ) : (
                            <><ChevronDown className="h-4 w-4 mr-1" /> View More ({teamProfiles.length - limit} more)</>
                          )}
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {community.flagText && (
            <>
              <div className="border-t border-border" />
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" /> Community Rules
                </h2>
                <ul className="space-y-2">
                  {community.flagText
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0)
                    .map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </div>


        {/* Top Content Creators — authors with most pinned posts */}
        {pinnedAuthors.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" /> Top Content Creators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pinnedAuthors.map((profile) => (
                <div key={profile.account} className="rounded-xl bg-card shadow-soft p-5 text-center space-y-3">
                  <Link to={`/user/${profile.account}`}>
                    <img
                      src={getAvatarUrl(profile.account)}
                      alt=""
                      className="h-16 w-16 rounded-full mx-auto border-2 border-accent object-cover"
                    />
                  </Link>
                  <div>
                    <Link to={`/user/${profile.account}`} className="font-heading font-bold text-card-foreground hover:text-primary transition-colors">
                      {profile.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">@{profile.account}</p>
                  </div>
                  {profile.about && <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">{profile.about}</p>}
                  <p className="text-xs text-muted-foreground">{authorTitles.get(profile.account) || `@${profile.account}`}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
