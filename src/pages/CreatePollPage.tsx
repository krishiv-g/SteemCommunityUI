import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { BarChart3, Send, Plus, X, LogIn } from 'lucide-react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useAppStore } from '@/store/useAppStore';
import { createPoll, deletePoll, buildPollSteemBody, buildPollJsonMetadata } from '@/services/polls.service';
import { broadcastCommentWithKey, broadcastCommentWithKeychain, getStoredPostingKey } from '@/services/steem.broadcast';
import { communityConfig } from '@/config/community';
import { toast } from 'sonner';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('7');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Login wall
  if (!currentUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="font-heading text-xl font-bold text-foreground">Sign in to create a poll</h2>
          <p className="text-muted-foreground text-sm">You need to be logged in to create polls.</p>
          <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <LogIn className="h-4 w-4" /> Sign In
          </Link>
        </div>
      </Layout>
    );
  }

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((o, i) => (i === index ? value : o)));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const validOptions = options.filter((o) => o.trim());
  const canPublish = title.trim() && validOptions.length >= 2 && !publishing;

  // Save to DB then immediately broadcast to Steem — single step, no extra confirmation
  const publish = async () => {
    if (!canPublish || !currentUser) return;
    setPublishing(true);
    const endsAt = new Date(Date.now() + parseInt(duration) * 86400_000).toISOString();
    try {
      // 1. Save to Supabase (gets us a stable permlink + DB record)
      const poll = await createPoll({
        author: currentUser.username,
        title,
        description,
        options: validOptions,
        endsAt,
        tags,
      });

      // 2. Broadcast to Steem automatically — Keychain shows its own popup, posting key is silent
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://worldofxpilar.com';
      const body = buildPollSteemBody(poll, siteUrl);
      const jsonMetadata = buildPollJsonMetadata(poll.tags);
      const params = {
        parentAuthor: '',
        parentPermlink: communityConfig.communityId,
        author: currentUser.username,
        permlink: poll.permlink,
        title: poll.title,
        body,
        jsonMetadata,
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
        // Broadcast failed or was cancelled — clean up the orphaned DB record
        await deletePoll(poll.id).catch(() => {});
        throw broadcastErr;
      }

      toast.success('Poll published!');
      navigate(`/polls/${poll.permlink}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish poll');
      // Stay on page — form is still filled, user can try again
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Layout>
      <div className="reading-width space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Create a Poll
        </h1>

        <div className="rounded-xl bg-card shadow-soft p-6 space-y-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Poll question"
            className="w-full text-xl font-heading font-bold bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />

          {/* Description */}
          <MarkdownEditor value={description} onChange={setDescription} height={150} preview="edit" />

          {/* Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Options</label>
            {options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button onClick={addOption} className="flex items-center gap-1 text-sm text-primary hover:underline mt-1">
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tags (up to 5)</label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-primary/70 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {tags.length < 5 && (
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={publish}
              disabled={!canPublish}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="h-4 w-4" />
              {publishing ? 'Publishing...' : 'Publish Poll'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
