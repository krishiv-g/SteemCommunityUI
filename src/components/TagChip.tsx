import { Link } from 'react-router-dom';

interface TagChipProps {
  name: string;
  count?: number;
  size?: 'sm' | 'md';
}

export function TagChip({ name, count, size = 'md' }: TagChipProps) {
  return (
    <Link
      to={`/tag/${name}`}
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-transparent
        bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20
        transition-all duration-150 ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
    >
      <span className="text-primary/60">#</span>
      <span>{name}</span>
      {count !== undefined && (
        <span className="text-muted-foreground/60 text-[10px] ml-0.5">({count})</span>
      )}
    </Link>
  );
}
