import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchFollowers, fetchFollowing, type FollowEntry } from '@/services/steem.accounts';
import { Loader2 } from 'lucide-react';

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  type: 'followers' | 'following';
}

export function FollowListDialog({ open, onOpenChange, username, type }: FollowListDialogProps) {
  const [entries, setEntries] = useState<FollowEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (start: string) => {
    setLoading(true);
    try {
      const fn = type === 'followers' ? fetchFollowers : fetchFollowing;
      const result = await fn(username, start, 50);
      const newItems = start ? result.slice(1) : result;
      setEntries(prev => [...prev, ...newItems]);
      setHasMore(newItems.length >= 49);
    } catch {
      setHasMore(false);
    }
    setLoading(false);
  }, [username, type]);

  useEffect(() => {
    if (open) {
      setEntries([]);
      setHasMore(true);
      fetchPage('');
    }
  }, [open, fetchPage]);

  const loadMore = () => {
    if (loading || !hasMore || entries.length === 0) return;
    const last = entries[entries.length - 1];
    const key = type === 'followers' ? last.follower : last.following;
    fetchPage(key);
  };

  const getName = (e: FollowEntry) => type === 'followers' ? e.follower : e.following;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">{type}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-1">
          {entries.map((entry) => {
            const name = getName(entry);
            return (
              <Link
                key={name}
                to={`/user/${name}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <img
                  src={`https://steemitimages.com/u/${name}/avatar`}
                  alt=""
                  className="h-9 w-9 rounded-full bg-muted"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">@{name}</p>
                  <p className="text-xs text-muted-foreground">Rep: {entry.reputation}</p>
                </div>
              </Link>
            );
          })}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && hasMore && entries.length > 0 && (
            <button
              onClick={loadMore}
              className="w-full py-2 text-sm text-primary hover:underline"
            >
              Load more
            </button>
          )}
          {!loading && entries.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No {type} yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
