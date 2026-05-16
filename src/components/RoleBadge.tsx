interface RoleBadgeProps {
  title: string;
  role?: string;
  size?: 'sm' | 'md';
}

const roleStyles: Record<string, string> = {
  owner: 'bg-primary/15 text-primary border-primary/30',
  admin: 'bg-primary/15 text-primary border-primary/30',
  mod: 'bg-secondary/15 text-secondary border-secondary/30',
  member: 'bg-muted text-muted-foreground border-border',
};

const roleLabels: Record<string, string> = {
  owner: '👑',
  admin: '🛡️',
  mod: '⚔️',
};

export function RoleBadge({ title, role, size = 'sm' }: RoleBadgeProps) {
  const style = (role && roleStyles[role]) || 'bg-muted text-muted-foreground border-border';
  const emoji = role && roleLabels[role];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-semibold w-fit ${style} ${sizeClass}`}>
      {emoji && <span>{emoji}</span>}
      {title}
    </span>
  );
}
