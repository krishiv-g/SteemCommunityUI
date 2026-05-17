import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';

interface MemberResult {
  account: string;
  displayName: string;
  avatarUrl: string;
  title?: string;
}

interface MemberSearchProps {
  onClose?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function MemberSearch({ onClose, autoFocus, className = '' }: MemberSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search/members?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(true);
        setActiveIdx(-1);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(query.trim()), 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const goTo = (account: string) => {
    navigate(`/user/${account}`);
    setQuery('');
    setOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); goTo(results[activeIdx].account); }
    if (e.key === 'Escape') { setOpen(false); onClose?.(); }
  };

  const highlight = (text: string, q: string) => {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary rounded-sm">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search members..."
          className="w-full pl-9 pr-8 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        ) : query ? (
          <button
            className="absolute right-2 text-muted-foreground hover:text-foreground p-1"
            onMouseDown={() => { setQuery(''); setOpen(false); onClose?.(); }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {results.map((m, i) => (
            <button
              key={m.account}
              onMouseDown={() => goTo(m.account)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                i === activeIdx ? 'bg-muted' : 'hover:bg-muted/60'
              } ${i !== results.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              <img
                src={m.avatarUrl}
                alt={m.account}
                className="h-7 w-7 rounded-full object-cover shrink-0 bg-muted"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {m.displayName && (
                    <p className="text-sm font-medium text-foreground leading-tight truncate">
                      {highlight(m.displayName, query)}
                    </p>
                  )}
                  {m.title && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary/15 text-secondary leading-none">
                      {m.title}
                    </span>
                  )}
                </div>
                <p className={`truncate ${m.displayName ? 'text-xs text-muted-foreground' : 'text-sm font-medium text-foreground'}`}>
                  @{highlight(m.account, query)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] rounded-xl border border-border bg-card shadow-xl px-4 py-3 text-sm text-muted-foreground">
          No members found for "{query}"
        </div>
      )}
    </div>
  );
}
