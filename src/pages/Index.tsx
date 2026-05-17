import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleCardSkeleton } from "@/components/ArticleCardSkeleton";
import type { Post } from "@/services/api.interface";
import { TrendingUp, Users, Star, Flame, Clock, ChevronRight, Hash } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchRankedPosts, fetchPinnedPosts } from "@/services/steem.posts";
import { useAppStore } from "@/store/useAppStore";
import { getAvatarUrl } from "@/services/avatar";
import { fetchAccounts, type SteemProfile } from "@/services/steem.accounts";

type FeedTab = "featured" | "trending" | "hot" | "latest";

const tabs = [
  { key: "featured" as FeedTab, label: "Featured", icon: Star },
  { key: "trending" as FeedTab, label: "Trending", icon: TrendingUp },
  { key: "hot" as FeedTab, label: "Hot", icon: Flame },
  { key: "latest" as FeedTab, label: "Latest", icon: Clock },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: FeedTab[] = ["featured", "trending", "hot", "latest"];
  const initialTab = validTabs.includes(searchParams.get("tab") as FeedTab)
    ? (searchParams.get("tab") as FeedTab)
    : "featured";

  const { currentUser } = useAppStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [topAuthors, setTopAuthors] = useState<SteemProfile[]>([]);
  const [authorTitles, setAuthorTitles] = useState<Map<string, string>>(new Map());

  const changeTab = (newTab: FeedTab) => {
    setTab(newTab);
    setSearchParams(newTab === "trending" ? {} : { tab: newTab }, { replace: true });
  };

  useEffect(() => {
    fetchPinnedPosts().then(async (pinned) => {
      const countMap = new Map<string, number>();
      const titleMap = new Map<string, string>();
      pinned.forEach((p) => {
        countMap.set(p.author.username, (countMap.get(p.author.username) || 0) + 1);
        if (p.author.communityTitle && !titleMap.has(p.author.username)) {
          titleMap.set(p.author.username, p.author.communityTitle);
        }
      });
      const sorted = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const usernames = sorted.map(([u]) => u);
      if (usernames.length > 0) {
        const profiles = await fetchAccounts(usernames);
        const profileMap = new Map(profiles.map((p) => [p.account, p]));
        setTopAuthors(usernames.map((u) => profileMap.get(u)!).filter(Boolean));
        setAuthorTitles(titleMap);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === "featured") {
      fetchPinnedPosts(currentUser?.username)
        .then((p) => { setPosts(p); setLoading(false); })
        .catch(() => { setPosts([]); setLoading(false); });
    } else {
      const sortMap: Record<string, string> = { trending: "trending", hot: "hot", latest: "created" };
      fetchRankedPosts(sortMap[tab] as any, 20, currentUser?.username)
        .then((p) => { setPosts(p); setLoading(false); })
        .catch(() => { setPosts([]); setLoading(false); });
    }
  }, [tab, currentUser?.username]);

  const { visibleItems, loadingMore, hasMore, sentinelRef } = useInfiniteScroll({ items: posts, pageSize: 6 });

  /* ── Right Sidebar ─────────────────────────────────────────────── */
  const sidebar = (
    <>
      {/* Top contributors */}
      {topAuthors.length > 0 && (
        <div className="rounded-lg bg-card border border-border p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" /> Top Contributors
          </h3>
          <div className="space-y-2">
            {topAuthors.map((profile) => (
              <Link
                key={profile.account}
                to={`/user/${profile.account}`}
                className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/60 transition-colors group"
              >
                <img
                  src={getAvatarUrl(profile.account)}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-border group-hover:border-primary/40 transition-colors shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{profile.name || profile.account}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {authorTitles.get(profile.account) || `@${profile.account}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/community"
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            View all members <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

    </>
  );

  return (
    <Layout sidebar={sidebar}>
      {/* Feed header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-heading font-bold text-foreground">Developer Feed</h1>
        <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => changeTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-0 sm:space-y-3">
          {[...Array(4)].map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-0 sm:space-y-3">
          {visibleItems.map((post, i) => (
            <ArticleCard
              key={post.id}
              post={post}
              variant={i === 0 && tab === 'featured' ? 'featured' : 'default'}
              index={i}
              fromLabel={tab.charAt(0).toUpperCase() + tab.slice(1)}
            />
          ))}

          {loadingMore && (
            <div className="space-y-3">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
          )}
          {hasMore && <div ref={sentinelRef} className="h-2" />}

          {!loading && visibleItems.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Hash className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No posts found. Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
