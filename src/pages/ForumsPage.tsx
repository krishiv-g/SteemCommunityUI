import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { fetchThreads, type DbThread } from '@/services/forums.service';
import { fetchAccounts } from '@/services/steem.accounts';
import { getAvatarUrl } from '@/services/avatar';
import { MessageSquare, Pin, Plus, Clock, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ThreadWithProfile extends DbThread {
  profileImage?: string;
}

export default function ForumsPage() {
  const [threads, setThreads] = useState<ThreadWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThreads().then(async (t) => {
      // Fetch profile images for all authors
      const uniqueAuthors = [...new Set(t.map(thread => thread.author))];
      const profiles = await fetchAccounts(uniqueAuthors);
      const profileMap = new Map(profiles.map(p => [p.account, p.profileImage]));
      
      const enrichedThreads: ThreadWithProfile[] = t.map(thread => ({
        ...thread,
        profileImage: profileMap.get(thread.author),
      }));
      
      setThreads(enrichedThreads);
      setLoading(false);
    });
  }, []);

  const pinned = threads.filter((t) => t.pinned);
  const regular = threads.filter((t) => !t.pinned);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            Forums
          </h1>
          <Link
            to="/forums/new"
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Thread</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card shadow-soft p-5 animate-pulse">
                <div className="h-5 w-2/3 bg-muted rounded mb-3" />
                <div className="h-4 w-1/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl bg-card shadow-soft p-10 text-center text-muted-foreground space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm">No threads yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pinned.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5" /> Pinned
                </h2>
                <div className="space-y-2">
                  {pinned.map((thread) => (
                    <ThreadRow key={thread.id} thread={thread} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Recent Discussions
              </h2>
              <div className="space-y-2">
                {regular.map((thread) => (
                  <ThreadRow key={thread.id} thread={thread} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}

function ThreadRow({ thread }: { thread: ThreadWithProfile }) {
  return (
    <Link
      to={`/forums/${thread.permlink}`}
      className="flex items-center gap-3 sm:gap-4 -mx-3 sm:mx-0 rounded-none sm:rounded-xl bg-card shadow-soft p-3 sm:p-5 hover:shadow-md transition-shadow group border-b sm:border-b-0 border-border/50"
    >
      <img
        src={getAvatarUrl(thread.author)}
        alt=""
        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-accent shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {thread.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0 mt-1" />}
          <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:truncate">
            {thread.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground truncate">
          <span className="font-medium">@{thread.author}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
          {thread.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground">#{tag}</span>
          ))}
        </div>
      </div>
      <div className="shrink-0 text-muted-foreground pl-2 sm:pl-3 border-l border-border/50">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
