import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ArticleCard } from '@/components/ArticleCard';
import { api } from '@/services';
import type { Post } from '@/services/api.interface';
import { Bookmark } from 'lucide-react';

export default function SavedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPosts().then(p => { setPosts(p.filter(pp => pp.bookmarked)); setLoading(false); });
  }, []);

  return (
    <Layout>
      <div className="reading-width space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-primary" /> Saved Posts
        </h1>
        {posts.length === 0 && !loading ? (
          <p className="text-center text-muted-foreground py-12">No saved posts yet. Bookmark articles to find them here.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => <ArticleCard key={post.id} post={post} index={i} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
