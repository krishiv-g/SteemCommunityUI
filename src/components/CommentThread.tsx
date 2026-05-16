import { useState } from 'react';
import { Send, ChevronDown, Loader2, MessageSquare } from 'lucide-react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { VoteButtons } from './VoteButtons';
import type { Comment } from '@/services/api.interface';
import { fetchDeeperReplies } from '@/services/steem.comments';
import { broadcastCommentWithKey, broadcastCommentWithKeychain, getStoredPostingKey } from '@/services/steem.broadcast';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface CommentThreadProps {
  postId: string;
  comments: Comment[];
}

export function CommentThread({ postId, comments: initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useToast();

  // postId is "author/permlink" for the parent post
  const [parentAuthor, parentPermlink] = postId.includes('/') ? postId.split('/') : ['', postId];

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUser || submitting) return;

    const permlink = `re-${parentPermlink}-${Date.now()}`.slice(0, 255);

    const optimistic: Comment = {
      id: `${currentUser.username}/${permlink}`,
      postId,
      author: { id: currentUser.username, username: currentUser.username, displayName: currentUser.username, avatar: currentUser.avatar, bio: '', followers: 0, following: 0, postCount: 0, joinedDate: '', reputation: 0, steemPower: 0, steemBalance: 0, sbdBalance: 0 },
      body: newComment,
      createdAt: new Date().toISOString(),
      votes: 0,
      userVote: 0,
      replies: [],
      pending: true,
      payout: 0,
    };

    setComments(c => [...c, optimistic]);
    setNewComment('');
    setSubmitting(true);

    const params = {
      parentAuthor,
      parentPermlink,
      author: currentUser.username,
      permlink,
      title: '',
      body: newComment,
      jsonMetadata: JSON.stringify({ app: 'wox/1.0' }),
    };

    try {
      if (currentUser.loginMethod === 'posting_key') {
        const wif = getStoredPostingKey();
        if (!wif) throw new Error('Posting key not found. Please log in again.');
        await broadcastCommentWithKey({ ...params, wif });
      } else {
        if (!window.steem_keychain) throw new Error('Steem Keychain not found.');
        await broadcastCommentWithKeychain(params);
      }
      setComments(c => c.map(cc => cc.id === optimistic.id ? { ...cc, pending: false } : cc));
      toast({ title: 'Comment posted' });
    } catch (err: any) {
      setComments(c => c.filter(cc => cc.id !== optimistic.id));
      setNewComment(newComment);
      toast({ title: 'Failed to post comment', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-xl font-bold">Comments ({comments.length})</h3>

      <div className="flex gap-3">
        {currentUser && <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full mt-1" />}
        <div className="flex-1 flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm min-h-[80px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="self-end p-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [loadedReplies, setLoadedReplies] = useState<Comment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useToast();

  const [commentAuthor, commentPermlink] = comment.id.split('/');

  const handleLoadMore = async () => {
    if (!commentAuthor || !commentPermlink) return;
    setLoading(true);
    try {
      const replies = await fetchDeeperReplies(commentAuthor, commentPermlink, currentUser?.username);
      setLoadedReplies(replies);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyBody.trim() || !currentUser || submittingReply) return;

    const permlink = `re-${commentPermlink}-${Date.now()}`.slice(0, 255);

    const optimistic: Comment = {
      id: `${currentUser.username}/${permlink}`,
      postId: comment.id,
      author: { id: currentUser.username, username: currentUser.username, displayName: currentUser.username, avatar: currentUser.avatar, bio: '', followers: 0, following: 0, postCount: 0, joinedDate: '', reputation: 0, steemPower: 0, steemBalance: 0, sbdBalance: 0 },
      body: replyBody,
      createdAt: new Date().toISOString(),
      votes: 0, userVote: 0, replies: [], pending: true, payout: 0,
    };

    const currentReplies = loadedReplies ?? comment.replies;
    setLoadedReplies([...currentReplies, optimistic]);
    setReplyBody('');
    setShowReply(false);
    setSubmittingReply(true);

    const params = {
      parentAuthor: commentAuthor,
      parentPermlink: commentPermlink,
      author: currentUser.username,
      permlink,
      title: '',
      body: replyBody,
      jsonMetadata: JSON.stringify({ app: 'wox/1.0' }),
    };

    try {
      if (currentUser.loginMethod === 'posting_key') {
        const wif = getStoredPostingKey();
        if (!wif) throw new Error('Posting key not found. Please log in again.');
        await broadcastCommentWithKey({ ...params, wif });
      } else {
        if (!window.steem_keychain) throw new Error('Steem Keychain not found.');
        await broadcastCommentWithKeychain(params);
      }
      setLoadedReplies(r => (r ?? []).map(c => c.id === optimistic.id ? { ...c, pending: false } : c));
      toast({ title: 'Reply posted' });
    } catch (err: any) {
      setLoadedReplies(r => (r ?? []).filter(c => c.id !== optimistic.id));
      setReplyBody(replyBody);
      toast({ title: 'Failed to post reply', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const replies = loadedReplies ?? comment.replies;

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border/40' : ''} ${comment.pending ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 py-3 px-4 rounded-lg border border-border/60 bg-card/50 my-1.5">
        <Link to={`/user/${comment.author.username}`}>
          <img src={comment.author.avatar} alt="" className="h-7 w-7 rounded-full" />
        </Link>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Link to={`/user/${comment.author.username}`} className="font-medium text-foreground hover:text-primary transition-colors">
              {comment.author.displayName}
            </Link>
            <span className="text-muted-foreground text-xs">
              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {comment.pending && <span className="text-xs text-muted-foreground italic">posting...</span>}
          </div>
          <div className="text-sm text-foreground/90 [&_.wmde-markdown]:!bg-transparent [&_.wmde-markdown]:!text-inherit [&_.wmde-markdown]:!text-sm" data-color-mode="auto">
            <MarkdownPreview source={comment.body} style={{ backgroundColor: 'transparent', color: 'inherit', fontSize: 'inherit' }} />
          </div>
          <div className="flex items-center gap-3">
            <VoteButtons postId={comment.id} votes={comment.votes} userVote={comment.userVote} size="sm" />
            {comment.payout > 0 && <span className="text-xs font-semibold text-primary">${comment.payout.toFixed(2)}</span>}
            {(replies.length > 0 || comment.hasMoreReplies) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
            {currentUser && !comment.pending && (
              <button
                onClick={() => setShowReply(v => !v)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {showReply ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
          {showReply && (
            <div className="flex gap-2 pt-2">
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder={`Reply to ${comment.author.displayName}...`}
                className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm min-h-[64px]"
                autoFocus
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyBody.trim() || submittingReply}
                className="self-end p-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {submittingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
      {replies.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
      {comment.hasMoreReplies && !loadedReplies && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="ml-8 pl-4 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Loading replies...</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Load more replies</>
          )}
        </button>
      )}
    </div>
  );
}
