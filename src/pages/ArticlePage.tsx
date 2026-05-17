import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Layout } from '@/components/Layout';
import { VoteButtons } from '@/components/VoteButtons';
import { CommentThread } from '@/components/CommentThread';
import { TagChip } from '@/components/TagChip';
import { fetchPost } from '@/services/steem.posts';
import { fetchComments } from '@/services/steem.comments';
import { useAppStore } from '@/store/useAppStore';
import type { Post, Comment as CommentType } from '@/services/api.interface';
import { ArrowLeft, Clock, Share2, Bookmark, BookmarkCheck, User } from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';

export default function ArticlePage() {
  const { id, '*': rest } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fullId = rest ? `${id}/${rest}` : id;
  const from = (location.state as { from?: { label: string; path: string } })?.from;
  const { currentUser } = useAppStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fullId || !fullId.includes('/')) return;
    const [author, ...permParts] = fullId.split('/');
    const permlink = permParts.join('/');
    if (!author || !permlink) return;

    fetchPost(author, permlink, currentUser?.username).then((p) => {
      // Redirect polls and forum threads to their own pages
      if (p.postType === 'poll') {
        navigate(`/polls/${permlink}`, { replace: true });
        return;
      }
      if (p.postType === 'forum') {
        navigate(`/forums/${permlink}`, { replace: true });
        return;
      }
      setPost(p);
      setLoading(false);
    }).catch(() => setLoading(false));

    fetchComments(author, permlink, currentUser?.username).then(setComments).catch(() => {});
  }, [fullId]);

  if (loading) {
    return (
      <Layout>
        <div className="reading-width animate-pulse space-y-6 py-8">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded-xl" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return <Layout><div className="reading-width py-16 text-center text-muted-foreground">Post not found.</div></Layout>;
  }

  return (
    <Layout>
      <article className="reading-width">
        {/* Back navigation */}
        <button
          onClick={() => from ? navigate(from.path) : navigate(-1 as any)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {from?.label || 'Feed'}
        </button>

        {/* Header */}
        <header className="space-y-4 mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">{post.title}</h1>

          <div className="flex items-center gap-4">
            <Link to={`/user/${post.author.username}`} className="flex items-center gap-3 group">
              <img src={post.author.avatar} alt="" className="h-12 w-12 rounded-full" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">{post.author.displayName}</p>
                  <span className="text-sm text-muted-foreground">({post.author.reputation})</span>
                </div>
                {post.author.communityTitle && (
                  <RoleBadge title={post.author.communityTitle} role={post.author.communityRole} size="md" />
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readingTime} min read</span>
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Cover */}
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="w-full rounded-xl mb-8 shadow-soft" />
        )}

        {/* Body */}
        <div className="mb-8" data-color-mode="auto">
          <MarkdownPreview
            source={post.body}
            className="md-preview-themed"
            style={{ backgroundColor: 'transparent', color: 'inherit' }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map(tag => <TagChip key={tag} name={tag} />)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between py-4 border-y border-border mb-8">
          <div className="flex items-center gap-4">
            <VoteButtons postId={post.id} votes={post.votes} userVote={post.userVote} />
            <span className="text-sm font-semibold text-primary">${post.payout.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {post.bookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div id="comments">
          <CommentThread postId={post.id} comments={comments} />
        </div>
      </article>
    </Layout>
  );
}
