import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/useAppStore';
import { fetchAccounts } from '@/services/steem.accounts';
import { communityConfig } from '@/config/community';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Globe, User, Image, FileText, Link, Server, Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [website, setWebsite] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(true);

  // RPC node management
  const [rpcNodes, setRpcNodes] = useState<string[]>([...communityConfig.rpcNodes]);
  const [customNode, setCustomNode] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    // Load current profile data from chain
    fetchAccounts([currentUser.username]).then((accounts) => {
      if (accounts.length > 0) {
        const p = accounts[0];
        setDisplayName(p.name || currentUser.username);
        setAbout(p.about || '');
        setWebsite(p.website || '');
        setProfileImage(p.profileImage || '');
        setCoverImage(p.coverImage || '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser, navigate]);

  const addCustomNode = () => {
    const node = customNode.trim();
    if (!node) return;
    try {
      new URL(node);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    if (rpcNodes.includes(node)) {
      toast.error('Node already in list');
      return;
    }
    setRpcNodes([...rpcNodes, node]);
    setCustomNode('');
    toast.success('Node added');
  };

  const removeNode = (index: number) => {
    if (rpcNodes.length <= 1) {
      toast.error('Must keep at least one RPC node');
      return;
    }
    setRpcNodes(rpcNodes.filter((_, i) => i !== index));
  };

  const handleSaveProfile = () => {
    // Broadcast will be added later
    toast.info('Profile broadcast coming soon — changes saved locally for now.');
  };

  const handleSaveNodes = () => {
    // Will persist to localStorage or store later
    toast.info('RPC node preferences saved for this session.');
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <Layout sidebar={false}>
        <div className="max-w-2xl mx-auto py-12 space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout sidebar={false}>
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>

        {/* Profile Settings */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </h2>

          {/* Profile Picture */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              Profile Picture URL
            </label>
            <div className="flex items-center gap-3">
              {profileImage && (
                <img src={profileImage} alt="" className="h-12 w-12 rounded-full object-cover border border-border" />
              )}
              <Input
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* Cover Picture */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Image className="h-4 w-4 text-muted-foreground" />
              Cover Image URL
            </label>
            {coverImage && (
              <div className="h-28 rounded-lg overflow-hidden border border-border">
                <img src={coverImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          {/* About */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              About
            </label>
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Link className="h-4 w-4 text-muted-foreground" />
              Website
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Save className="h-4 w-4" />
            Save Profile
          </button>
          <p className="text-xs text-muted-foreground">
            Broadcast to Steem blockchain coming soon. Changes are preview-only for now.
          </p>
        </section>

        {/* Signature Message */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Signature Message
          </h2>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-mono text-foreground">
              "Login to SteemDev [timestamp]"
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This message is signed each time you log in to verify your identity.
              The timestamp prevents replay attacks.
            </p>
          </div>
        </section>

        {/* RPC Nodes */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Steem RPC Nodes
          </h2>

          <div className="space-y-2">
            {rpcNodes.map((node, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm text-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span className="flex-1 truncate">{node}</span>
                <button
                  onClick={() => removeNode(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={customNode}
              onChange={(e) => setCustomNode(e.target.value)}
              placeholder="https://custom-rpc-node.com"
              onKeyDown={(e) => e.key === 'Enter' && addCustomNode()}
            />
            <button
              onClick={addCustomNode}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Nodes are used in priority order with automatic failover. Drag to reorder (coming soon).
          </p>

          <button
            onClick={handleSaveNodes}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Save className="h-4 w-4" />
            Save Node Preferences
          </button>
        </section>
      </div>
    </Layout>
  );
}
