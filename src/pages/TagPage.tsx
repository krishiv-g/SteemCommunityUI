import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ArticleCardSkeleton';
import { fetchPostsByTag } from '@/services/steem.posts';
import type { Post } from '@/services/api.interface';
import { Hash } from 'lucide-react';

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    setPosts([]);
    fetchPostsByTag(tag)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Hash className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold text-foreground">{tag}</h1>
          {!loading && <span className="text-muted-foreground text-sm">· {posts.length} posts</span>}
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            : posts.map((post, i) => (
                <ArticleCard key={post.id} post={post} index={i} fromLabel={`#${tag}`} />
              ))}
        </div>

        {!loading && posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No posts found for #{tag}</p>
        )}
      </div>
    </Layout>
  );
}
