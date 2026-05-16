import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Link } from 'react-router-dom';
import { LogIn, MessageSquare, Users, Send, Pin, Trash2, VolumeX, Volume2, Hash, ChevronLeft, Shield, X, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import {
  ChatMessage,
  fetchCommunityMessages,
  fetchDmMessages,
  fetchDmContacts,
  fetchPinnedMessages,
  sendMessage,
  deleteMessage,
  togglePinMessage,
  muteUser,
  unmuteUser,
  isUserMuted,
  subscribeToCommunityChat,
  subscribeToDms,
  getUserCommunityRole,
  isModerator,
} from '@/services/chat.service';

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

export default function ChatPage() {
  const { currentUser } = useAppStore();
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'community' | 'dm'>('community');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMsgs, setPinnedMsgs] = useState<ChatMessage[]>([]);
  const [dmContacts, setDmContacts] = useState<string[]>([]);
  const [activeDmUser, setActiveDmUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [newDmUser, setNewDmUser] = useState('');
  const [muteDialogUser, setMuteDialogUser] = useState<string | null>(null);
  const [muteReason, setMuteReason] = useState('');
  const [muteDuration, setMuteDuration] = useState('1h');
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ismod = isModerator(userRole);

  // Fetch role
  useEffect(() => {
    if (currentUser) getUserCommunityRole(currentUser.username).then(setUserRole);
  }, [currentUser]);

  // Fetch messages
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    if (activeTab === 'community') {
      Promise.all([fetchCommunityMessages(), fetchPinnedMessages()]).then(([msgs, pinned]) => {
        setMessages(msgs);
        setPinnedMsgs(pinned);
        setLoading(false);
      });
    } else if (activeDmUser) {
      fetchDmMessages(currentUser.username, activeDmUser).then((msgs) => {
        setMessages(msgs);
        setLoading(false);
      });
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [activeTab, activeDmUser, currentUser?.username]);

  // Fetch DM contacts
  useEffect(() => {
    if (currentUser) fetchDmContacts(currentUser.username).then(setDmContacts);
  }, [currentUser]);

  // Realtime subscriptions
  useEffect(() => {
    if (!currentUser) return;
    const unsubs: (() => void)[] = [];

    unsubs.push(subscribeToCommunityChat((msg) => {
      if (activeTab === 'community') {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.id);
          if (exists) return prev.map((m) => m.id === msg.id ? msg : m);
          return [...prev, msg];
        });
      }
    }));

    unsubs.push(subscribeToDms(currentUser.username, (msg) => {
      if (activeTab === 'dm') {
        const otherUser = msg.sender === currentUser.username ? msg.recipient : msg.sender;
        if (otherUser === activeDmUser) {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === msg.id);
            if (exists) return prev.map((m) => m.id === msg.id ? msg : m);
            return [...prev, msg];
          });
        }
      }
      const otherUser = msg.sender === currentUser.username ? msg.recipient : msg.sender;
      if (otherUser && !dmContacts.includes(otherUser)) {
        setDmContacts((prev) => [...prev, otherUser!]);
      }
    }));

    return () => unsubs.forEach((u) => u());
  }, [activeTab, activeDmUser, currentUser?.username]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Login wall — after all hooks
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Sign in to Chat</h2>
          <p className="text-muted-foreground">Join the community conversation</p>
          <Button asChild><Link to="/login"><LogIn className="h-4 w-4 mr-2" />Sign In</Link></Button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    // Check if muted
    const muted = await isUserMuted(currentUser.username);
    if (muted) {
      toast({ title: 'You are muted', description: 'You cannot send messages while muted.', variant: 'destructive' });
      return;
    }

    setSending(true);
    const sent = await sendMessage({
      sender: currentUser.username,
      content: newMessage.trim(),
      channel: activeTab === 'community' ? 'community' : 'dm',
      recipient: activeTab === 'dm' ? activeDmUser ?? undefined : undefined,
    });
    setSending(false);

    if (sent) {
      setNewMessage('');
      inputRef.current?.focus();
    } else {
      toast({ title: 'Failed to send', variant: 'destructive' });
    }
  };

  const handleDelete = async (msgId: string) => {
    const ok = await deleteMessage(msgId);
    if (ok) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast({ title: 'Message deleted' });
    }
  };

  const handlePin = async (msg: ChatMessage) => {
    const newPinned = !msg.pinned;
    const ok = await togglePinMessage(msg.id, newPinned);
    if (ok) {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, pinned: newPinned } : m));
      if (newPinned) setPinnedMsgs((prev) => [msg, ...prev]);
      else setPinnedMsgs((prev) => prev.filter((m) => m.id !== msg.id));
      toast({ title: newPinned ? 'Message pinned' : 'Message unpinned' });
    }
  };

  const handleMute = async () => {
    if (!muteDialogUser) return;
    const durationMap: Record<string, number> = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
    const hours = durationMap[muteDuration] || 1;
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
    const ok = await muteUser({
      username: muteDialogUser,
      muted_by: currentUser.username,
      expires_at: expiresAt,
      reason: muteReason || undefined,
    });
    if (ok) toast({ title: `@${muteDialogUser} muted for ${muteDuration}` });
    setMuteDialogUser(null);
    setMuteReason('');
  };

  const handleUnmute = async (username: string) => {
    const ok = await unmuteUser(username);
    if (ok) toast({ title: `@${username} unmuted` });
  };

  const startDm = (username: string) => {
    setActiveTab('dm');
    setActiveDmUser(username);
    if (!dmContacts.includes(username)) setDmContacts((prev) => [...prev, username]);
  };

  const handleNewDm = () => {
    if (newDmUser.trim()) {
      startDm(newDmUser.trim().replace('@', ''));
      setShowNewDm(false);
      setNewDmUser('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 lg:w-80 border-r border-border/50 bg-card/50 shrink-0`}>
        {/* Tabs */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => { setActiveTab('community'); setActiveDmUser(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'community' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Hash className="h-4 w-4" />Community
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'dm' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="h-4 w-4" />Messages
          </button>
        </div>

        {/* Sidebar content */}
        <ScrollArea className="flex-1">
          {activeTab === 'community' ? (
            <div className="p-3 space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Community Chat</span>
                </div>
                <p className="text-xs text-muted-foreground">Public chat for World of Xpilar community</p>
              </div>

              {pinnedMsgs.length > 0 && (
                <button onClick={() => setShowPinned(!showPinned)} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  <Pin className="h-3.5 w-3.5" />
                  {pinnedMsgs.length} pinned message{pinnedMsgs.length !== 1 ? 's' : ''}
                </button>
              )}

              {ismod && (
                <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-medium">Mod Tools</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Right-click messages for mod actions</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 space-y-1">
              <Button size="sm" variant="outline" className="w-full mb-2" onClick={() => setShowNewDm(true)}>
                <MessageSquare className="h-4 w-4 mr-2" /> New Message
              </Button>
              {dmContacts.map((contact) => (
                <button
                  key={contact}
                  onClick={() => { setActiveDmUser(contact); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors ${activeDmUser === contact ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://steemitimages.com/u/${contact}/avatar`} />
                    <AvatarFallback>{contact[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">@{contact}</span>
                </button>
              ))}
              {dmContacts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/50">
          <button className="md:hidden p-1" onClick={() => setShowSidebar(true)}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          {activeTab === 'community' ? (
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <span className="font-semibold">Community Chat</span>
            </div>
          ) : activeDmUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={`https://steemitimages.com/u/${activeDmUser}/avatar`} />
                <AvatarFallback>{activeDmUser[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <Link to={`/user/${activeDmUser}`} className="font-semibold hover:underline">@{activeDmUser}</Link>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a conversation</span>
          )}
        </div>

        {/* Pinned messages banner */}
        {showPinned && pinnedMsgs.length > 0 && (
          <div className="border-b border-border/50 bg-accent/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1"><Pin className="h-3 w-3" /> Pinned Messages</span>
              <button onClick={() => setShowPinned(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            {pinnedMsgs.map((m) => (
              <div key={m.id} className="flex items-start gap-2 p-2 rounded bg-background/50 text-sm">
                <span className="font-medium text-primary shrink-0">@{m.sender}</span>
                <span className="text-foreground">{m.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground animate-pulse">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.sender === currentUser.username;
              const showAvatar = i === 0 || messages[i - 1].sender !== msg.sender;
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  ismod={ismod}
                  onDelete={() => handleDelete(msg.id)}
                  onPin={() => handlePin(msg)}
                  onMute={() => setMuteDialogUser(msg.sender)}
                  onUnmute={() => handleUnmute(msg.sender)}
                  onDm={() => startDm(msg.sender)}
                />
              );
            })
          )}
        </div>

        {/* Input */}
        {(activeTab === 'community' || activeDmUser) && (
          <div className="p-3 border-t border-border/50 bg-card/50">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={activeTab === 'community' ? 'Message #community...' : `Message @${activeDmUser}...`}
                className="flex-1"
                maxLength={2000}
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* New DM dialog */}
      <Dialog open={showNewDm} onOpenChange={setShowNewDm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Enter a username to start a conversation</DialogDescription>
          </DialogHeader>
          <Input value={newDmUser} onChange={(e) => setNewDmUser(e.target.value)} placeholder="@username" />
          <DialogFooter>
            <Button onClick={handleNewDm} disabled={!newDmUser.trim()}>Start Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mute dialog */}
      <Dialog open={!!muteDialogUser} onOpenChange={(o) => !o && setMuteDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mute @{muteDialogUser}</DialogTitle>
            <DialogDescription>Prevent this user from sending messages</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Duration</label>
              <div className="flex gap-2 mt-1">
                {['1h', '6h', '24h', '7d'].map((d) => (
                  <Button key={d} size="sm" variant={muteDuration === d ? 'default' : 'outline'} onClick={() => setMuteDuration(d)}>{d}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea value={muteReason} onChange={(e) => setMuteReason(e.target.value)} placeholder="Reason for muting..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteDialogUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMute}><VolumeX className="h-4 w-4 mr-2" />Mute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Message Bubble Component ───────────────────────────────

function MessageBubble({
  msg,
  isOwn,
  showAvatar,
  ismod,
  onDelete,
  onPin,
  onMute,
  onUnmute,
  onDm,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  ismod: boolean;
  onDelete: () => void;
  onPin: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onDm: () => void;
}) {
  return (
    <div className={`group flex items-start gap-2 py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors ${showAvatar ? 'mt-3' : ''}`}>
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://steemitimages.com/u/${msg.sender}/avatar`} />
            <AvatarFallback>{msg.sender[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-center gap-2 mb-0.5">
            <Link to={`/user/${msg.sender}`} className="text-sm font-semibold text-primary hover:underline">
              @{msg.sender}
            </Link>
            <span className="text-[10px] text-muted-foreground">{formatMsgTime(msg.created_at)}</span>
            {msg.pinned && <Pin className="h-3 w-3 text-secondary" />}
          </div>
        )}
        <p className="text-sm text-foreground break-words">{msg.content}</p>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-muted">
              <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {!isOwn && (
              <DropdownMenuItem onClick={onDm}>
                <MessageSquare className="h-4 w-4 mr-2" /> Message
              </DropdownMenuItem>
            )}
            {(ismod || isOwn) && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            )}
            {ismod && (
              <>
                <DropdownMenuItem onClick={onPin}>
                  {msg.pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                  {msg.pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                {!isOwn && (
                  <DropdownMenuItem onClick={onMute} className="text-destructive">
                    <VolumeX className="h-4 w-4 mr-2" /> Mute User
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
