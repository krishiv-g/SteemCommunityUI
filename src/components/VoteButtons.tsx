import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { broadcastVoteWithKey, getStoredPostingKey } from '@/services/steem.broadcast';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoteButtonsProps {
  postId: string;
  votes: number;
  userVote: number;
  size?: 'sm' | 'md';
}

export function VoteButtons({ postId, votes: initialVotes, userVote: initialUserVote, size = 'md' }: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [showSlider, setShowSlider] = useState(false);
  const [voteWeight, setVoteWeight] = useState(100);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const upvoteBtnRef = useRef<HTMLButtonElement>(null);
  const [sliderPos, setSliderPos] = useState<{ top: number; left: number } | null>(null);
  const { currentUser } = useAppStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Close slider on outside click
  useEffect(() => {
    if (!showSlider) return;
    const handler = (e: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(e.target as Node)) {
        setShowSlider(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSlider]);

  const [author, permlink] = postId.includes('/') ? postId.split('/') : ['', ''];

  const broadcastVote = async (weight: number) => {
    if (!currentUser) {
      toast({ title: 'Please log in to vote', variant: 'destructive' });
      return;
    }

    setBroadcasting(true);
    const oldVote = userVote;
    const oldVotes = votes;

    const newUserVote = weight === 0 ? 0 : weight > 0 ? 1 : -1;
    setUserVote(newUserVote);
    setVotes(v => v + (newUserVote - oldVote));

    try {
      if (currentUser.loginMethod === 'posting_key') {
        const wif = getStoredPostingKey();
        if (!wif) throw new Error('Posting key not found in session. Please log in again.');
        await broadcastVoteWithKey(currentUser.username, author, permlink, weight, wif);
      } else {
        if (!window.steem_keychain) {
          throw new Error('Steem Keychain not found. Please install the extension.');
        }
        await new Promise<void>((resolve, reject) => {
          window.steem_keychain!.requestBroadcast(
            currentUser.username,
            [['vote', { voter: currentUser.username, author, permlink, weight }]],
            'Posting',
            (response) => {
              if (response.success) resolve();
              else reject(new Error(response.error || response.message || 'Keychain broadcast failed'));
            }
          );
        });
      }
      toast({ title: weight === 0 ? 'Vote removed' : `Voted ${Math.abs(weight / 100)}%` });
    } catch (err: any) {
      setUserVote(oldVote);
      setVotes(oldVotes);
      toast({ title: 'Vote failed', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleUpvoteClick = () => {
    if (userVote === 1) {
      setShowRemoveConfirm(true);
    } else {
      if (upvoteBtnRef.current) {
        const rect = upvoteBtnRef.current.getBoundingClientRect();
        setSliderPos({
          top: rect.top,
          left: rect.left + rect.width / 2,
        });
      }
      setVoteWeight(100);
      setShowSlider(true);
    }
  };

  const handleDownvoteClick = () => {
    if (userVote === -1) {
      setShowRemoveConfirm(true);
    } else {
      broadcastVote(-10000);
    }
  };

  const handleConfirmRemove = () => {
    setShowRemoveConfirm(false);
    broadcastVote(0);
  };

  const handleConfirmUpvote = () => {
    setShowSlider(false);
    broadcastVote(voteWeight * 100);
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnClass = size === 'sm' ? 'p-0.5' : 'p-1';

  // Mobile: render slider as a bottom sheet dialog; Desktop: portal above button
  const renderSlider = () => {
    if (!showSlider) return null;

    const sliderContent = (
      <div className="text-sm font-semibold text-foreground mb-3 text-center">
        Vote Weight: <span className="text-emerald-500">{voteWeight}%</span>
      </div>
    );

    if (isMobile) {
      // Bottom sheet style on mobile
      return createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={() => setShowSlider(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 animate-in fade-in-0" />
          {/* Bottom sheet */}
          <div
            ref={sliderRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-popover border-t border-border rounded-t-2xl shadow-lg p-5 pb-8 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
            {sliderContent}
            <Slider
              value={[voteWeight]}
              onValueChange={([v]) => setVoteWeight(v)}
              min={1}
              max={100}
              step={1}
              className="mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSlider(false)}
                className="flex-1 text-sm py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpvote}
                disabled={broadcasting}
                className="flex-1 text-sm py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                Vote
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
    }

    // Desktop: floating above button
    return createPortal(
      <div
        ref={sliderRef}
        className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-lg p-3 w-48 animate-in fade-in-0 zoom-in-95"
        style={{
          top: sliderPos ? sliderPos.top - 4 : 0,
          left: sliderPos ? sliderPos.left : 0,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="text-xs font-semibold text-foreground mb-2 text-center">
          Vote Weight: <span className="text-emerald-500">{voteWeight}%</span>
        </div>
        <Slider
          value={[voteWeight]}
          onValueChange={([v]) => setVoteWeight(v)}
          min={1}
          max={100}
          step={1}
          className="mb-2"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowSlider(false)}
            className="flex-1 text-xs py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmUpvote}
            disabled={broadcasting}
            className="flex-1 text-xs py-1 rounded-md bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            Vote
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex items-center gap-1">
        {/* Upvote */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={upvoteBtnRef}
              onClick={handleUpvoteClick}
              disabled={broadcasting}
              className={`${btnClass} rounded-full transition-all disabled:opacity-50 ${
                userVote === 1
                  ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/40'
                  : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
              }`}
            >
              <ChevronUp className={`${iconSize} ${userVote === 1 ? 'stroke-[3]' : ''}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {userVote === 1 ? 'Remove Vote' : 'Upvote'}
          </TooltipContent>
        </Tooltip>

        {/* Vote count */}
        <span className={`font-bold tabular-nums ${size === 'sm' ? 'text-sm' : 'text-base'} ${
          userVote === 1 ? 'text-emerald-500' : userVote === -1 ? 'text-red-500' : votes > 0 ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {votes}
        </span>

        {/* Downvote */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDownvoteClick}
              disabled={broadcasting}
              className={`${btnClass} rounded-full transition-all disabled:opacity-50 ${
                userVote === -1
                  ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/40'
                  : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
              }`}
            >
              <ChevronDown className={`${iconSize} ${userVote === -1 ? 'stroke-[3]' : ''}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {userVote === -1 ? 'Remove Vote' : 'Downvote'}
          </TooltipContent>
        </Tooltip>

        {/* Vote weight slider */}
        {renderSlider()}

        {/* Remove vote confirmation */}
        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove your vote?</AlertDialogTitle>
              <AlertDialogDescription>
                Removing your vote will reset your curation rewards on this post. This action will be broadcast to the Steem blockchain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove Vote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
