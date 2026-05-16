import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { fetchPolls, type DbPoll } from '@/services/polls.service';
import { useAppStore } from '@/store/useAppStore';
import { BarChart3, Plus, Clock, CheckCircle2, Users, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PollsPage() {
  const { currentUser } = useAppStore();
  const [polls, setPolls] = useState<DbPoll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls(currentUser?.username).then((p) => {
      setPolls(p);
      setLoading(false);
    });
  }, [currentUser?.username]);

  const now = new Date();
  const active = polls.filter((p) => new Date(p.ends_at) > now);
  const closed = polls.filter((p) => new Date(p.ends_at) <= now);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Polls
          </h1>
          <Link
            to="/polls/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Poll
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card shadow-soft p-6 animate-pulse">
                <div className="h-5 w-3/4 bg-muted rounded mb-3" />
                <div className="h-4 w-1/2 bg-muted rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-8 w-full bg-muted rounded" />
                  <div className="h-8 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No polls yet. Create the first one!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Active Polls
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {active.map((poll) => (
                    <PollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              </section>
            )}

            {closed.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Closed Polls
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {closed.map((poll) => (
                    <PollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PollCard({ poll }: { poll: DbPoll }) {
  const hasVoted = !!poll.userVotedOptionId;
  const isClosed = new Date(poll.ends_at) <= new Date();

  return (
    <Link to={`/polls/${poll.permlink}`} className="block rounded-xl bg-card shadow-soft p-6 space-y-4 hover:shadow-md transition-shadow">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-foreground">{poll.title}</h3>
          {isClosed ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">Closed</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Active</span>
          )}
        </div>
        {poll.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{poll.description}</p>
        )}
      </div>

      <div className="space-y-1.5">
        {poll.options.slice(0, 3).map((option) => {
          const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          return (
            <div key={option.id} className="relative rounded-md border border-border px-3 py-2 text-sm overflow-hidden">
              <div className="absolute inset-0 bg-primary/10" style={{ width: `${pct}%` }} />
              <div className="relative flex items-center justify-between">
                <span className="text-foreground text-xs">{option.label}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            </div>
          );
        })}
        {poll.options.length > 3 && (
          <p className="text-xs text-muted-foreground">+{poll.options.length - 3} more options</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {poll.totalVotes} votes
          </span>
          <span className="text-muted-foreground">by @{poll.author}</span>
        </div>
        <span>
          {isClosed
            ? 'Poll ended'
            : `Ends ${formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}`}
        </span>
      </div>
    </Link>
  );
}
