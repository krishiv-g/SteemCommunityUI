import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ArticleCard } from '@/components/ArticleCard';
import { TagChip } from '@/components/TagChip';
import { api } from '@/services';
import type { Post } from '@/services/api.interface';
import { Hash } from 'lucide-react';

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    api.getPosts(tag).then(p => { setPosts(p); setLoading(false); });
  }, [tag]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Hash className="h-7 w-7 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{tag}</h1>
          <span className="text-muted-foreground">· {posts.length} posts</span>
        </div>
        <div className="grid gap-0 sm:gap-6 sm:grid-cols-2 -mx-3 sm:mx-0">
          {posts.map((post, i) => <ArticleCard key={post.id} post={post} index={i} />)}
        </div>
        {!loading && posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No posts found for #{tag}</p>
        )}
      </div>
    </Layout>
  );
}
