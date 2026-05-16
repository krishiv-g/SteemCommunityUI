import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleCardSkeleton } from "@/components/ArticleCardSkeleton";
import { TagChip } from "@/components/TagChip";
import { HempLogo } from "@/components/HempLogo";
import { api } from "@/services";
import type { Post, Tag } from "@/services/api.interface";
import { TrendingUp, Clock, Star, Flame, PenTool } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchRankedPosts, fetchPinnedPosts } from "@/services/steem.posts";
import { useAppStore } from "@/store/useAppStore";
import { fetchAccounts, type SteemProfile } from "@/services/steem.accounts";
import { communityConfig } from "@/config/community";


type FeedTab = "featured" | "trending" | "hot" | "latest";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: FeedTab[] = ["featured", "trending", "hot", "latest"];
  const initialTab = validTabs.includes(searchParams.get("tab") as FeedTab) ? (searchParams.get("tab") as FeedTab) : "featured";
  const { currentUser } = useAppStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [pinnedAuthors, setPinnedAuthors] = useState<SteemProfile[]>([]);
  const [authorTitles, setAuthorTitles] = useState<Map<string, string>>(new Map());

  const changeTab = (newTab: FeedTab) => {
    setTab(newTab);
    setSearchParams(newTab === "trending" ? {} : { tab: newTab }, { replace: true });
  };

  // Fetch sidebar data once
  useEffect(() => {
    api.getTags().then(setTags);

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

  // Fetch posts based on tab selection — all tabs use real Steem API
  useEffect(() => {
    setLoading(true);

    if (tab === "featured") {
      fetchPinnedPosts(currentUser?.username)
        .then((p) => { setPosts(p); setLoading(false); })
        .catch(() => { setPosts([]); setLoading(false); });
    } else {
      const sortMap: Record<string, string> = {
        trending: "trending",
        hot: "hot",
        latest: "created",
      };
      fetchRankedPosts(sortMap[tab] as any, 20, currentUser?.username)
        .then((p) => { setPosts(p); setLoading(false); })
        .catch(() => { setPosts([]); setLoading(false); });
    }
  }, [tab, currentUser?.username]);

  const { visibleItems, loadingMore, hasMore, sentinelRef } = useInfiniteScroll({
    items: posts,
    pageSize: 4,
  });

  const featured = visibleItems[0];
  const rest = visibleItems.slice(1);

  const sidebar = (
    <>
      <div className="rounded-xl bg-card shadow-soft p-5 space-y-3">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-secondary" /> Trending Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags
            .filter((t) => t.trending)
            .map((t) => (
              <TagChip key={t.name} name={t.name} count={t.postCount} size="sm" />
            ))}
        </div>
      </div>
      {pinnedAuthors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <PenTool className="h-4 w-4 text-primary" /> Top Creators
          </h3>
          {pinnedAuthors.map((profile) => (
            <Link
              key={profile.account}
              to={`/user/${profile.account}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <img
                src={profile.profileImage}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-accent object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://steemitimages.com/u/${profile.account}/avatar`; }}
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{authorTitles.get(profile.account) || `@${profile.account}`}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <Layout sidebar={sidebar}>
      {/* Tagline */}
      <p className="mb-6 text-muted-foreground text-lg">{communityConfig.tagline}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-muted w-fit mx-auto sm:mx-0">
        {(
          [
            { key: "featured", label: "Featured", icon: Star },
            { key: "trending", label: "Trending", icon: TrendingUp },
            { key: "hot", label: "Hot", icon: Flame },
            { key: "latest", label: "Latest", icon: Clock },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => changeTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <ArticleCardSkeleton />
          <div className="grid gap-6 sm:grid-cols-2">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </div>
      ) : (
        <div className="space-y-0 sm:space-y-6">
          <div className="-mx-3 sm:mx-0">{featured && <ArticleCard post={featured} variant="featured" index={0} fromLabel={tab.charAt(0).toUpperCase() + tab.slice(1)} />}</div>
          <div className="grid gap-0 sm:gap-6 sm:grid-cols-2">
            {rest.map((post, i) => (
              <ArticleCard key={post.id} post={post} index={i + 1} fromLabel={tab.charAt(0).toUpperCase() + tab.slice(1)} />
            ))}
          </div>

          {/* Infinite scroll skeleton + sentinel */}
          {loadingMore && (
            <div className="grid gap-6 sm:grid-cols-2">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
          )}
          {hasMore && <div ref={sentinelRef} className="h-4" />}
        </div>
      )}
    </Layout>
  );
}
