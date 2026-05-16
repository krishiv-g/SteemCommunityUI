import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { fetchThreadByPermlink, type DbThread } from '@/services/forums.service';
import { fetchPost } from '@/services/steem.posts';
import { fetchComments } from '@/services/steem.comments';
import { useAppStore } from '@/store/useAppStore';
import type { Post, Comment } from '@/services/api.interface';
import { CommentThread } from '@/components/CommentThread';
import { VoteButtons } from '@/components/VoteButtons';
import { ArrowLeft, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MarkdownPreview from '@uiw/react-markdown-preview';

export default function ForumThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAppStore();

  const [thread, setThread] = useState<DbThread | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetchThreadByPermlink(id).then(async (t) => {
      if (!t) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setThread(t);

      // Fetch post body + comments from Steem in parallel
      const [steemPost, steemComments] = await Promise.all([
        fetchPost(t.author, t.permlink, currentUser?.username).catch(() => null),
        fetchComments(t.author, t.permlink, currentUser?.username).catch(() => []),
      ]);

      setPost(steemPost);
      setComments(steemComments);
      setLoading(false);
    });
  }, [id, currentUser?.username]);

  if (loading) {
    return (
      <Layout>
        <div className="reading-width py-6 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="rounded-xl bg-card shadow-soft p-6 sm:p-8 space-y-4">
            <div className="h-8 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound || !thread) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Thread not found.</p>
          <Link to="/forums" className="text-primary hover:underline text-sm mt-2 inline-block">
            ← Back to Forums
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reading-width space-y-4 sm:space-y-6">
        <Link to="/forums" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Forums
        </Link>

        {/* Thread body */}
        <article className="rounded-xl bg-card shadow-soft p-4 sm:p-8 space-y-4">
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-foreground">{thread.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            <Link to={`/user/${thread.author}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
              <img
                src={`https://steemitimages.com/u/${thread.author}/avatar`}
                alt=""
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-accent"
              />
              <span className="font-medium">@{thread.author}</span>
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {comments.length} replies
            </span>
            {post && (
              <span className="font-semibold text-primary">${post.payout.toFixed(2)}</span>
            )}
          </div>

          {/* Tags */}
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {thread.tags.map(tag => (
                <Link key={tag} to={`/tag/${tag}`} className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/40 transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Post body from Steem */}
          {post ? (
            <div data-color-mode="auto">
              <MarkdownPreview
                source={post.body}
                className="md-preview-themed"
                style={{ backgroundColor: 'transparent', color: 'inherit' }}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">Could not load thread content from Steem.</p>
          )}

          {/* Vote + payout footer */}
          {post && (
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <VoteButtons postId={post.id} votes={post.votes} userVote={post.userVote} />
            </div>
          )}
        </article>

        {/* Replies — real Steem comments, fully broadcast-capable */}
        <div className="rounded-xl bg-card shadow-soft p-4 sm:p-6">
          <CommentThread
            postId={`${thread.author}/${thread.permlink}`}
            comments={comments}
          />
        </div>
      </div>
    </Layout>
  );
}
