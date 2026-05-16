import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ArticleCard } from '@/components/ArticleCard';
import { fetchAccounts, fetchFollowCount, type SteemProfile } from '@/services/steem.accounts';
import { fetchAccountPosts } from '@/services/steem.posts';
import { useAppStore } from '@/store/useAppStore';
import { FollowListDialog } from '@/components/FollowListDialog';
import type { Post } from '@/services/api.interface';
import { Calendar, Zap, MapPin, Globe, Users } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAppStore();
  const [profile, setProfile] = useState<SteemProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followCount, setFollowCount] = useState<{ follower_count: number; following_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followDialog, setFollowDialog] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetchAccounts([username]),
      fetchAccountPosts(username, 100, currentUser?.username),
      fetchFollowCount(username),
    ]).then(([accounts, p, fc]) => {
      if (accounts.length === 0) {
        setNotFound(true);
      } else {
        setProfile(accounts[0]);
      }
      setPosts(p);
      setFollowCount(fc);
      setLoading(false);
    }).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [username]);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse reading-width space-y-6 py-8">
          <div className="h-24 w-24 rounded-full bg-muted mx-auto" />
          <div className="h-6 w-48 bg-muted rounded mx-auto" />
          <div className="h-4 w-64 bg-muted rounded mx-auto" />
        </div>
      </Layout>
    );
  }

  if (notFound || !profile) {
    return (
      <Layout>
        <div className="reading-width py-16 text-center text-muted-foreground">User not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reading-width space-y-8">
        {/* Cover image */}
        {profile.coverImage && (
          <div className="relative -mx-4 sm:-mx-6 h-48 rounded-xl overflow-hidden">
            <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Profile header */}
        <div className="text-center space-y-4">
          <img
            src={profile.profileImage}
            alt=""
            className="h-24 w-24 rounded-full mx-auto border-4 border-accent shadow-soft"
          />
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{profile.name}</h1>
            <p className="text-muted-foreground">@{profile.account}</p>
          </div>

          {profile.about && (
            <p className="text-foreground/80 max-w-md mx-auto">{profile.about}</p>
          )}

          <div className="flex justify-center gap-6 text-sm">
            <Stat icon={Zap} label="Reputation" value={profile.reputation} />
            {followCount && (
              <>
                <Stat icon={Users} label="Followers" value={followCount.follower_count} onClick={() => setFollowDialog('followers')} />
                <Stat icon={Users} label="Following" value={followCount.following_count} onClick={() => setFollowDialog('following')} />
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {profile.accountAge} on Steem
            </span>
          </div>

          <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Follow
          </button>
        </div>

        {username && (
          <FollowListDialog
            open={followDialog !== null}
            onOpenChange={(open) => !open && setFollowDialog(null)}
            username={username}
            type={followDialog || 'followers'}
          />
        )}

        {/* Posts from our community */}
        <div className="space-y-4">
          {posts.map((post, i) => (
            <ArticleCard key={post.id} post={post} variant="default" index={i} fromLabel={`${profile.name}'s Profile`} />
          ))}
          {posts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No posts in this community yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Stat({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: number; onClick?: () => void }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper className={`text-center ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} onClick={onClick}>
      <p className="font-bold text-foreground flex items-center justify-center gap-1">
        <Icon className="h-3.5 w-3.5 text-secondary" />
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Wrapper>
  );
}
