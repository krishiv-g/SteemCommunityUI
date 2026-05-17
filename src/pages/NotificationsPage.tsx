import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { api } from '@/services';
import type { Notification } from '@/services/api.interface';
import { useAppStore } from '@/store/useAppStore';
import { Bell, ChevronUp, MessageCircle, AtSign, UserPlus, Repeat2 } from 'lucide-react';

const iconMap = {
  vote: ChevronUp,
  mention: AtSign,
  reply: MessageCircle,
  follow: UserPlus,
  resteem: Repeat2,
};

export default function NotificationsPage() {
  const { currentUser } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.getNotifications(currentUser?.username)
      .then(n => { setNotifications(n); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [currentUser?.username]);

  return (
    <Layout>
      <div className="reading-width space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Notifications
        </h1>

        <div className="space-y-1">
          {!loading && error && (
            <p className="text-sm text-destructive text-center py-12">Failed to load notifications: {error}</p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              {currentUser ? 'No notifications yet.' : 'Log in to see your notifications.'}
            </p>
          )}
          {notifications.map(n => {
            const Icon = iconMap[n.type as keyof typeof iconMap] ?? Bell;
            return (
              <div key={n.id} className={`flex items-start gap-3 p-4 rounded-lg transition-colors ${n.read ? '' : 'bg-accent/10'}`}>
                <div className="p-2 rounded-full bg-accent/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <Link to={`/user/${n.actor.username}`} className="font-medium hover:text-primary transition-colors">
                      {n.actor.displayName}
                    </Link>{' '}
                    {n.message}
                  </p>
                  {n.postId && (
                    <Link to={`/post/${n.postId}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      view post →
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-secondary mt-2" />}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
