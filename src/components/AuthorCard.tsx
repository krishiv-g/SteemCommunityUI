import { Link } from 'react-router-dom';
import type { User } from '@/services/api.interface';

interface AuthorCardProps {
  user: User;
  compact?: boolean;
}

export function AuthorCard({ user, compact }: AuthorCardProps) {
  if (compact) {
    return (
      <Link to={`/user/${user.username}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
        <img src={user.avatar} alt="" className="h-10 w-10 rounded-full" />
        <div>
          <p className="font-medium text-sm text-foreground">{user.displayName}</p>
          <p className="text-xs text-muted-foreground">@{user.username} · {user.reputation} rep</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-xl bg-card shadow-soft p-5 text-center space-y-3">
      <Link to={`/user/${user.username}`}>
        <img src={user.avatar} alt="" className="h-16 w-16 rounded-full mx-auto border-2 border-accent" />
      </Link>
      <div>
        <Link to={`/user/${user.username}`} className="font-heading font-bold text-card-foreground hover:text-primary transition-colors">
          {user.displayName}
        </Link>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
      <div className="flex justify-center gap-4 text-sm">
        <span><strong className="text-foreground">{user.followers}</strong> <span className="text-muted-foreground">followers</span></span>
        <span><strong className="text-foreground">{user.postCount}</strong> <span className="text-muted-foreground">posts</span></span>
      </div>
    </div>
  );
}
