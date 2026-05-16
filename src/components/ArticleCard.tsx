import { Link, useLocation } from 'react-router-dom';
import { Clock, MessageCircle, Bookmark, BookmarkCheck, BarChart3, MessageSquareText } from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import type { Post } from '@/services/api.interface';
import { motion } from 'framer-motion';
import { RoleBadge } from './RoleBadge';

interface ArticleCardProps {
  post: Post;
  variant?: 'default' | 'featured' | 'compact';
  index?: number;
  fromLabel?: string;
}

export function ArticleCard({ post, variant = 'default', index = 0, fromLabel }: ArticleCardProps) {
  const isFeatured = variant === 'featured';
  const location = useLocation();
  const linkState = { from: { label: fromLabel || 'Feed', path: location.pathname + location.search } };
  const isCompact = variant === 'compact';

  // Route to the correct detail page based on post type
  // post.id is always "author/permlink" — extract permlink for polls/forums
  const permlink = post.id.split('/')[1];
  const postLink = post.postType === 'poll'
    ? `/polls/${permlink}`
    : post.postType === 'forum'
      ? `/forums/${permlink}`
      : `/post/${post.id}`;

  const typeBadge = post.postType === 'poll' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <BarChart3 className="h-3 w-3" /> Poll
    </span>
  ) : post.postType === 'forum' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
      <MessageSquareText className="h-3 w-3" /> Forum
    </span>
  ) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`group rounded-none sm:rounded-xl bg-card shadow-soft hover:shadow-elevated transition-all duration-300 overflow-hidden ${
        isFeatured ? 'md:grid md:grid-cols-2' : ''
      }`}
    >
      {!isCompact && (
        <Link to={postLink} state={linkState} className="block overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isFeatured ? 'h-full min-h-[280px]' : 'h-52'
            }`}
            loading="lazy"
          />
        </Link>
      )}

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/user/${post.author.username}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
            <img src={post.author.avatar} alt="" className="h-6 w-6 rounded-full" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-foreground">{post.author.displayName}</span>
              {post.author.communityTitle && (
                <RoleBadge title={post.author.communityTitle} role={post.author.communityRole} />
              )}
            </div>
          </Link>
          <span className="text-xs text-muted-foreground">({post.author.reputation})</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        <Link to={postLink} state={linkState}>
          <div className="flex items-center gap-2">
            {typeBadge}
            <h2 className={`font-heading font-bold text-card-foreground hover:text-primary transition-colors leading-tight ${
              isFeatured ? 'text-2xl' : 'text-lg'
            }`}>
              {post.title}
            </h2>
          </div>
        </Link>

        {!isCompact && post.postType === 'poll' && post.pollOptions ? (
          <div className="space-y-1.5">
            {post.pollOptions.slice(0, 3).map((opt, i) => {
              const pct = post.pollTotalVotes && post.pollTotalVotes > 0
                ? Math.round((opt.votes / post.pollTotalVotes) * 100) : 0;
              return (
                <div key={i} className="relative rounded-md border border-border px-3 py-2 text-xs overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between">
                    <span className="text-foreground">{opt.label}</span>
                    <span className="text-muted-foreground ml-2">{pct}%</span>
                  </div>
                </div>
              );
            })}
            {post.pollOptions.length > 3 && (
              <p className="text-xs text-muted-foreground">+{post.pollOptions.length - 3} more options</p>
            )}
          </div>
        ) : !isCompact ? (
          <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map(tag => (
            <Link key={tag} to={`/tag/${tag}`} className="text-xs px-2.5 py-1 rounded-full bg-accent/30 text-accent-foreground hover:bg-accent/50 transition-colors">
              #{tag}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <VoteButtons postId={post.id} votes={post.votes} userVote={post.userVote} size="sm" />
            <Link to={`${postLink}#comments`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="h-4 w-4" />
              {post.commentCount}
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min
            </span>
            <span className="font-semibold text-primary">${post.payout.toFixed(2)}</span>
            <button className="hover:text-foreground transition-colors">
              {post.bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
