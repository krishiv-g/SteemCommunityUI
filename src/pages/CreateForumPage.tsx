import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Send, Tag, X, MessageSquare, LogIn } from 'lucide-react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useAppStore } from '@/store/useAppStore';
import { createThread, deleteThread, buildThreadBody, buildThreadJsonMetadata } from '@/services/forums.service';
import { broadcastCommentWithKey, broadcastCommentWithKeychain, getStoredPostingKey } from '@/services/steem.broadcast';
import { communityConfig } from '@/config/community';
import { toast } from 'sonner';

export default function CreateForumPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const canPublish = title.trim() && body.trim() && !publishing;

  const publish = async () => {
    if (!canPublish || !currentUser) return;
    setPublishing(true);

    try {
      // 1. Save to Supabase index — gets us a stable permlink
      const thread = await createThread({
        author: currentUser.username,
        title: title.trim(),
        tags,
      });

      // 2. Broadcast to Steem — if user cancels, delete the DB record
      const params = {
        parentAuthor: '',
        parentPermlink: communityConfig.communityId,
        author: currentUser.username,
        permlink: thread.permlink,
        title: title.trim(),
        body: buildThreadBody(body.trim()),
        jsonMetadata: buildThreadJsonMetadata(['forum', ...tags]),
      };

      try {
        if (currentUser.loginMethod === 'posting_key') {
          const wif = getStoredPostingKey();
          if (!wif) throw new Error('Posting key not found. Please re-login.');
          await broadcastCommentWithKey({ ...params, wif });
        } else {
          await broadcastCommentWithKeychain(params);
        }
      } catch (broadcastErr: any) {
        await deleteThread(thread.id).catch(() => {});
        throw broadcastErr;
      }

      toast.success('Thread published!');
      navigate(`/forums/${thread.permlink}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish thread');
    } finally {
      setPublishing(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center max-w-md w-full space-y-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Sign in to Start a Thread</h1>
            <p className="text-muted-foreground text-sm">
              You need to be logged in to create forum threads.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reading-width space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          New Forum Thread
        </h1>

        <div className="rounded-xl bg-card shadow-soft p-6 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thread title"
            className="w-full text-2xl font-heading font-bold bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />

          <MarkdownEditor value={body} onChange={setBody} height={250} preview="live" />

          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/30 text-accent-foreground">
                #{tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag..."
                className="px-3 py-1.5 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none w-28"
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={publish}
              disabled={!canPublish}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="h-4 w-4" />
              {publishing ? 'Publishing...' : 'Publish Thread'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
