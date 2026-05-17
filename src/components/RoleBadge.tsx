interface RoleBadgeProps {
  title: string;
  role?: string;
  size?: 'sm' | 'md';
}

const roleStyles: Record<string, string> = {
  owner: 'bg-primary/10 text-primary border-primary/25',
  admin: 'bg-primary/10 text-primary border-primary/25',
  mod: 'bg-secondary/10 text-secondary border-secondary/25',
  member: 'bg-muted text-muted-foreground border-border',
};

const roleIcons: Record<string, string> = {
  owner: '◈',
  admin: '◆',
  mod: '◇',
};

export function RoleBadge({ title, role, size = 'sm' }: RoleBadgeProps) {
  const style = (role && roleStyles[role]) || 'bg-muted text-muted-foreground border-border';
  const icon = role && roleIcons[role];
  const sizeClass = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-0.5 rounded border font-mono font-semibold w-fit ${style} ${sizeClass}`}>
      {icon && <span className="opacity-70">{icon}</span>}
      {title}
    </span>
  );
}
