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
      className={`inline-flex items-center gap-1.5 rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/40 transition-colors font-medium ${
        size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3.5 py-1.5'
      }`}
    >
      <span>#{name}</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </Link>
  );
}
