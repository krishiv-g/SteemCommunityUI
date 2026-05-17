import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { fetchPollByPermlink, castPollVote, type DbPoll } from '@/services/polls.service';
import { fetchPost } from '@/services/steem.posts';
import { fetchAccounts } from '@/services/steem.accounts';
import { getAvatarUrl } from '@/services/avatar';
import { broadcastCustomJsonWithKey, broadcastCustomJsonWithKeychain, getStoredPostingKey } from '@/services/steem.broadcast';
import { useAppStore } from '@/store/useAppStore';
import { Clock, Users, CheckCircle2, ArrowLeft, LogIn } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface PollWithProfile extends DbPoll {
  authorAvatar?: string;
}

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAppStore();
  const [poll, setPoll] = useState<PollWithProfile | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPollByPermlink(id, currentUser?.username).then(async (p) => {
      if (p) {
        // Fetch author profile image
        try {
          const [profile] = await fetchAccounts([p.author]);
          setPoll({ ...p, authorAvatar: profile?.profileImage });
        } catch {
          setPoll(p);
        }
      } else {
        setPoll(null);
      }
      setLoading(false);
      // Fetch payout from Steem post in background
      if (p?.author && p?.permlink) {
        fetchPost(p.author, p.permlink).then(post => setPayout(post.payout)).catch(() => {});
      }
    });
  }, [id, currentUser?.username]);

  const handleVote = async (optionId: string) => {
    if (!poll || !currentUser || voting) return;
    const isClosed = new Date(poll.ends_at) <= new Date();
    if (isClosed || poll.userVotedOptionId) return;

    setVoting(true);

    // Optimistic UI — revert on any failure
    setPoll((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        userVotedOptionId: optionId,
        totalVotes: prev.totalVotes + 1,
        options: prev.options.map((o) =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o
        ),
      };
    });

    try {
      // Step 1: Broadcast to Steem FIRST — if user cancels Keychain, vote is not recorded
      const voteJson = JSON.stringify({
        poll_permlink: poll.permlink,
        option_id: optionId,
        app: 'wox/polls',
      });

      if (currentUser.loginMethod === 'keychain') {
        await broadcastCustomJsonWithKeychain(
          currentUser.username,
          'wox_poll_vote',
          voteJson,
          `Vote on: ${poll.title}`,
        );
      } else {
        const wif = getStoredPostingKey();
        if (!wif) throw new Error('Posting key not found. Please re-login.');
        await broadcastCustomJsonWithKey(currentUser.username, 'wox_poll_vote', voteJson, wif);
      }

      // Step 2: Broadcast confirmed — now save to DB
      await castPollVote(poll.id, optionId, currentUser.username);
      toast.success('Vote cast!');
    } catch (err: any) {
      // Either broadcast cancelled/failed, or DB save failed — revert optimistic UI
      toast.error(err.message || 'Vote cancelled');
      setPoll((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          userVotedOptionId: undefined,
          totalVotes: prev.totalVotes - 1,
          options: prev.options.map((o) =>
            o.id === optionId ? { ...o, votes: o.votes - 1 } : o
          ),
        };
      });
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="reading-width space-y-6 animate-pulse">
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="space-y-3 mt-6">
            <div className="h-12 w-full bg-muted rounded-lg" />
            <div className="h-12 w-full bg-muted rounded-lg" />
            <div className="h-12 w-full bg-muted rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!poll) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Poll not found.</p>
          <Link to="/polls" className="text-primary hover:underline text-sm mt-2 inline-block">
            ← Back to Polls
          </Link>
        </div>
      </Layout>
    );
  }

  const hasVoted = !!poll.userVotedOptionId;
  const isClosed = new Date(poll.ends_at) <= new Date();

  return (
    <Layout>
      <div className="reading-width space-y-6">
        <Link to="/polls" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          All Polls
        </Link>

        <div className="rounded-xl bg-card shadow-soft p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-heading text-2xl font-bold text-foreground">{poll.title}</h1>
              {isClosed ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0 font-medium">Closed</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Active
                </span>
              )}
            </div>

            {poll.description && (
              <p className="text-muted-foreground leading-relaxed">{poll.description}</p>
            )}

            {poll.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {poll.tags.map(tag => (
                  <Link key={tag} to={`/tag/${tag}`} className="text-xs px-2.5 py-1 rounded-full bg-accent/30 text-accent-foreground hover:bg-accent/50 transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <img
                  src={getAvatarUrl(poll.author)}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
                <Link to={`/user/${poll.author}`} className="hover:text-foreground transition-colors">
                  @{poll.author}
                </Link>
              </span>
              <span>·</span>
              <span>{format(new Date(poll.created_at), 'MMM d, yyyy')}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {poll.totalVotes} votes
              </span>
              {!isClosed && (
                <>
                  <span>·</span>
                  <span>Ends {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}</span>
                </>
              )}
              {payout !== null && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-primary">${payout.toFixed(2)}</span>
                </>
              )}
            </div>
          </div>

          {/* Poll Options */}
          <div className="space-y-3">
            {poll.options.map((option) => {
              const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
              const isSelected = poll.userVotedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={isClosed || hasVoted || !currentUser || voting}
                  className={`relative w-full text-left rounded-lg border px-5 py-3.5 text-sm transition-all overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  } ${isClosed || hasVoted || !currentUser ? '' : 'cursor-pointer'}`}
                >
                  <div
                    className="absolute inset-0 bg-primary/10 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium ml-3">
                      {pct}% <span className="text-xs">({option.votes})</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {!currentUser && !isClosed && (
            <Link to="/login" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <LogIn className="h-4 w-4" /> Sign in to vote
            </Link>
          )}
          {hasVoted && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              You voted on this poll.
            </p>
          )}
          {!hasVoted && !isClosed && currentUser && (
            <p className="text-xs text-muted-foreground">
              Select an option to cast your vote. You cannot change your vote after submitting.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
