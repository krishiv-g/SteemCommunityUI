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
  const isCompact = variant === 'compact';
  const location = useLocation();
  const linkState = { from: { label: fromLabel || 'Feed', path: location.pathname + location.search } };

  const permlink = post.id.split('/')[1];
  const postLink = post.postType === 'poll'
    ? `/polls/${permlink}`
    : post.postType === 'forum'
      ? `/forums/${permlink}`
      : `/post/${post.id}`;

  const typeBadge = post.postType === 'poll' ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
      <BarChart3 className="h-2.5 w-2.5" /> poll
    </span>
  ) : post.postType === 'forum' ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-secondary/10 text-secondary border border-secondary/20">
      <MessageSquareText className="h-2.5 w-2.5" /> forum
    </span>
  ) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={`group bg-card transition-all duration-200 overflow-hidden ${
        isCompact
          ? 'border-b border-border sm:border sm:rounded-md'
          : 'border-b border-border sm:border sm:rounded-xl sm:shadow-soft sm:hover:shadow-elevated -mx-3 sm:mx-0'
      }`}
    >
      {/* Featured hero image */}
      {isFeatured && post.coverImage && (
        <Link to={postLink} state={linkState} className="block overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-44 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </Link>
      )}

      {/* Card body */}
      <div className={`flex ${isCompact ? 'p-3 gap-3' : 'p-0'}`}>

        {/* Main content */}
        <div className={`flex-1 min-w-0 flex flex-col gap-2 ${!isCompact ? 'p-3.5 sm:p-4' : ''}`}>

          {/* Author + date row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Link
              to={`/user/${post.author.username}`}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                loading="lazy"
              />
              <span className="text-xs font-semibold text-foreground">{post.author.displayName}</span>
            </Link>
            {post.author.communityTitle && (
              <RoleBadge title={post.author.communityTitle} role={post.author.communityRole} />
            )}
            <span className="text-xs text-muted-foreground">·</span>
            <time className="text-xs text-muted-foreground font-mono">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </time>
            {typeBadge && <span className="ml-0.5">{typeBadge}</span>}
          </div>

          {/* Title + mobile thumbnail row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <Link to={postLink} state={linkState}>
                <h2 className={`font-heading font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors ${
                  isFeatured ? 'text-xl sm:text-2xl' : isCompact ? 'text-sm' : 'text-sm sm:text-base lg:text-lg'
                }`}>
                  {post.title}
                </h2>
              </Link>
            </div>

            {/* Mobile-only thumbnail — small, inline with title */}
            {!isFeatured && !isCompact && post.coverImage && (
              <Link to={postLink} state={linkState} className="sm:hidden shrink-0">
                <div className="w-16 h-14 rounded-lg overflow-hidden border border-border">
                  <img
                    src={post.coverImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </Link>
            )}
          </div>

          {/* Excerpt */}
          {!isCompact && post.postType !== 'poll' && (
            <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed hidden sm:block">
              {post.excerpt}
            </p>
          )}

          {/* Poll preview */}
          {!isCompact && post.postType === 'poll' && post.pollOptions && (
            <div className="space-y-1">
              {post.pollOptions.slice(0, 3).map((opt, i) => {
                const pct = post.pollTotalVotes && post.pollTotalVotes > 0
                  ? Math.round((opt.votes / post.pollTotalVotes) * 100) : 0;
                return (
                  <div key={i} className="relative rounded border border-border px-3 py-1.5 text-xs overflow-hidden">
                    <div className="absolute inset-0 bg-primary/8 rounded" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between gap-2">
                      <span className="text-foreground truncate">{opt.label}</span>
                      <span className="text-muted-foreground font-mono shrink-0">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {!isCompact && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 4).map(tag => (
                <Link
                  key={tag}
                  to={`/tag/${tag}`}
                  className="text-[10px] sm:text-[11px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Footer: votes + comments + reading time + payout */}
          <div className="flex items-center justify-between pt-1 mt-auto gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <VoteButtons postId={post.id} votes={post.votes} userVote={post.userVote} size="sm" />
              <Link
                to={`${postLink}#comments`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{post.commentCount}</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" />
                {post.readingTime}m
              </span>
              <span className="font-mono font-semibold text-green-500 dark:text-green-400">${post.payout.toFixed(2)}</span>
              <button className="hover:text-foreground transition-colors min-h-[36px] px-1 flex items-center">
                {post.bookmarked
                  ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                  : <Bookmark className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop thumbnail — flush right, hidden on mobile */}
        {!isFeatured && !isCompact && post.coverImage && (
          <Link to={postLink} state={linkState} className="hidden sm:block shrink-0 w-48 xl:w-56 self-stretch p-1.5 pl-0">
            <div className="h-full min-h-[110px] max-h-44 rounded-lg overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </Link>
        )}
      </div>
    </motion.article>
  );
}
