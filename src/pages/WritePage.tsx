import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/useAppStore';
import { communityConfig } from '@/config/community';
import {
  broadcastCommentWithKey,
  broadcastCommentWithKeychain,
  generatePermlink,
  getStoredPostingKey,
} from '@/services/steem.broadcast';
import { createDraft, updateDraft, fetchDrafts, deleteDraft, type Draft } from '@/services/drafts.service';
import { ArrowLeft, Send, Save, Tag, X, Settings, Eye, Columns2, Pencil, LogIn, FolderOpen, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { toast } from 'sonner';
import { withFooter } from '@/lib/postFooter';

type EditorMode = 'write' | 'split' | 'preview';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function WritePage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('write');
  const [category, setCategory] = useState('');

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const charCount = body.length;

  useEffect(() => {
    if (!currentUser) return;
    fetchDrafts(currentUser.username)
      .then(setDrafts)
      .catch(() => {});
  }, [currentUser]);

  const refreshDrafts = async () => {
    if (!currentUser) return;
    try {
      const rows = await fetchDrafts(currentUser.username);
      setDrafts(rows);
    } catch {}
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const permlink = useMemo(() => generatePermlink(title), [title]);

  const publish = async () => {
    if (!currentUser || !title.trim() || !body.trim()) return;
    setPublishing(true);

    const allTags = [...tags];
    if (category && !allTags.includes(category)) allTags.unshift(category);

    const jsonMetadata = JSON.stringify({
      tags: allTags,
      app: 'steemdev/1.0',
      format: 'markdown',
    });

    const broadcastParams = {
      parentAuthor: '',
      parentPermlink: communityConfig.communityId,
      author: currentUser.username,
      permlink,
      title: title.trim(),
      body: withFooter(body),
      jsonMetadata,
      beneficiaries: [] as { account: string; weight: number }[],
    };

    try {
      if (currentUser.loginMethod === 'keychain') {
        await broadcastCommentWithKeychain(broadcastParams);
      } else {
        const wif = getStoredPostingKey();
        if (!wif) throw new Error('Posting key not found. Please log in again.');
        await broadcastCommentWithKey({ ...broadcastParams, wif });
      }
      toast.success('Post published successfully!');
      navigate(`/post/${currentUser.username}/${permlink}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish post');
    } finally {
      setPublishing(false);
    }
  };

  const saveDraft = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const allTags = [...tags];
      if (category && !allTags.includes(category)) allTags.unshift(category);

      if (draftId) {
        await updateDraft(draftId, { title, body, tags: allTags });
        toast.success('Draft updated');
      } else {
        const draft = await createDraft({ username: currentUser.username, title, body, tags: allTags });
        setDraftId(draft.id);
        toast.success('Draft saved');
      }
      await refreshDrafts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const loadDraft = (draft: Draft) => {
    setTitle(draft.title);
    setBody(draft.body);
    setTags(draft.tags ?? []);
    setDraftId(draft.id);
    setDraftsOpen(false);
    setMode('write');
    toast.success(`Loaded: "${draft.title || 'Untitled draft'}"`);
  };

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteDraft(id);
      if (draftId === id) {
        setDraftId(null);
        setTitle('');
        setBody('');
        setTags([]);
      }
      await refreshDrafts();
      toast.success('Draft deleted');
    } catch {
      toast.error('Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  // Login wall
  if (!currentUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center max-w-md w-full space-y-4">
            <Pencil className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Sign in to Write</h1>
            <p className="text-muted-foreground text-sm">
              You need to be logged in to create posts on the community.
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

  const categories = ['worldnews', 'photography', 'art', 'technology', 'science', 'travel', 'food', 'music', 'gaming', 'sports'];

  return (
    <Layout wide>
      <div className="py-2 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Post Editor</h1>
          {draftId && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground font-medium">
              Editing draft
            </span>
          )}

          {/* Mode tabs - desktop */}
          <div className="hidden md:flex items-center gap-1 ml-auto bg-muted/50 rounded-lg p-1">
            {([
              { key: 'write' as const, icon: Pencil, label: 'Write' },
              { key: 'split' as const, icon: Columns2, label: 'Split' },
              { key: 'preview' as const, icon: Eye, label: 'Preview' },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your post a title..."
          className="w-full text-2xl md:text-3xl font-heading font-bold bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b border-border/40 pb-3"
        />

        {/* Mode tabs - mobile */}
        <div className="flex md:hidden items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
          {([
            { key: 'write' as const, icon: Pencil, label: 'Write' },
            { key: 'preview' as const, icon: Eye, label: 'Preview' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Main content: editor + sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Editor area */}
          <div className="flex-1 min-w-0">
            {mode === 'write' && (
              <MarkdownEditor value={body} onChange={setBody} height={680} />
            )}

            {mode === 'split' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <MarkdownEditor value={body} onChange={setBody} height={680} preview="edit" />
                </div>
                <div className="rounded-xl border border-border bg-card p-6 overflow-auto" style={{ maxHeight: 740 }}>
                  <div data-color-mode="auto">
                    <MarkdownPreview
                      source={body || '*Start writing to see a preview…*'}
                      className="md-preview-themed"
                      style={{ backgroundColor: 'transparent', color: 'inherit' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'preview' && (
              <div className="rounded-xl border border-border bg-card p-6 md:p-8 overflow-auto min-h-[400px]">
                <h2 className="font-heading text-2xl font-bold text-foreground italic mb-4">
                  {title || 'Untitled Post'}
                </h2>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="h-10 w-10 rounded-full bg-muted"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground">Just now · {category || 'Uncategorized'}</p>
                  </div>
                </div>
                <div data-color-mode="auto">
                  <MarkdownPreview
                    source={body || '*Start writing to see a preview…*'}
                    className="md-preview-themed"
                    style={{ backgroundColor: 'transparent', color: 'inherit' }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {charCount} characters · Markdown supported
            </p>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">

            {/* Drafts panel */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setDraftsOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
              >
                <FolderOpen className="h-4 w-4 text-primary" />
                Your Drafts
                {drafts.length > 0 && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    {drafts.length}
                  </span>
                )}
                {draftsOpen ? <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" /> : <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />}
              </button>

              {draftsOpen && (
                <div className="border-t border-border divide-y divide-border/50 max-h-64 overflow-y-auto">
                  {drafts.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-muted-foreground text-center">No drafts yet.</p>
                  ) : (
                    drafts.map((draft) => (
                      <button
                        key={draft.id}
                        onClick={() => loadDraft(draft)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors group ${draftId === draft.id ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {draft.title || <span className="italic text-muted-foreground">Untitled</span>}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {draft.body ? draft.body.slice(0, 60) + (draft.body.length > 60 ? '…' : '') : 'Empty'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo(draft.updated_at)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                            disabled={deletingId === draft.id}
                            className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all"
                            title="Delete draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Post Settings */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Post Settings
              </h3>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Tags (max 5)</label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={tags.length >= 5}
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/30 text-accent-foreground"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Publishing */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Publishing</h3>
              <button
                onClick={publish}
                disabled={publishing || !title.trim() || !body.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="h-4 w-4" />
                {publishing ? 'Publishing...' : 'Publish Now'}
              </button>
              <button
                onClick={saveDraft}
                disabled={saving || publishing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : draftId ? 'Update Draft' : 'Save as Draft'}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Your post will be visible to all users once published.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
