import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ImageIcon,
  ArrowLeft,
  Calendar,
  PenLine,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/upload';
import { useReveal } from '@/lib/useReveal';
import { SectionHeading } from './About';
import type { BlogPost } from '@/lib/types';

export function Blog() {
  const { user } = useAuth();
  const { ref, visible } = useReveal();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<BlogPost | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    setPosts((data ?? []) as BlogPost[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (!error) setPosts((p) => p.filter((x) => x.id !== id));
  };

  const handleSaved = (p: BlogPost, isNew: boolean) => {
    setPosts((prev) =>
      isNew ? [p, ...prev] : prev.map((x) => (x.id === p.id ? p : x))
    );
    setShowForm(false);
    setEditing(null);
  };

  if (reading) {
    return <PostReader post={reading} onBack={() => setReading(null)} />;
  }

  return (
    <section id="blog" className="relative py-24 sm:py-32">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-5 sm:px-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <SectionHeading
          index="04"
          title="Blog"
          subtitle="Notes and write-ups on data, code, and learning."
        />

        {user && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="mt-6 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:from-emerald-300 hover:to-cyan-300 transition-all glow"
          >
            <Plus className="w-4 h-4" /> Write post
          </button>
        )}

        {loading ? (
          <div className="mt-12 flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-12 glass rounded-2xl p-16 text-center">
            <PenLine className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No posts yet.</p>
            <p className="text-sm text-slate-600 mt-1">
              Sign in as the owner to write your first post.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p, i) => (
              <PostCard
                key={p.id}
                post={p}
                owner={!!user}
                delay={i * 70}
                onRead={() => setReading(p)}
                onEdit={() => {
                  setEditing(p);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <PostForm
          post={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

function PostCard({
  post,
  owner,
  delay,
  onRead,
  onEdit,
  onDelete,
}: {
  post: BlogPost;
  owner: boolean;
  delay: number;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className="group glass glass-hover rounded-2xl overflow-hidden animate-fade-up flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={onRead}
        className="relative aspect-[16/10] bg-ink-850 overflow-hidden text-left"
      >
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        {owner && (
          <div className="absolute top-3 right-3 flex gap-2">
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 rounded-lg bg-ink-950/70 backdrop-blur text-emerald-300 hover:bg-ink-950/90"
            >
              <Pencil className="w-3.5 h-3.5" />
            </span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg bg-ink-950/70 backdrop-blur text-rose-300 hover:bg-ink-950/90"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </button>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <h3 className="text-white font-medium font-[Sora] group-hover:text-emerald-300 transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-3 flex-1">{post.excerpt}</p>
        )}
        <button
          onClick={onRead}
          className="mt-4 text-xs text-emerald-300 hover:text-emerald-200 self-start"
        >
          Read more →
        </button>
      </div>
    </article>
  );
}

function PostReader({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  return (
    <section className="relative min-h-screen pt-28 pb-20">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-[Sora] text-white text-balance">
          {post.title}
        </h1>

        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="mt-8 w-full aspect-[16/9] object-cover rounded-2xl border border-white/10"
          />
        )}

        {post.excerpt && (
          <p className="mt-8 text-lg text-emerald-200/80 leading-relaxed font-[Sora]">
            {post.excerpt}
          </p>
        )}

        {post.content && (
          <div className="mt-6 prose-invert max-w-none text-slate-300 leading-[1.8] whitespace-pre-wrap">
            {post.content}
          </div>
        )}
      </div>
    </section>
  );
}

function PostForm({
  post,
  onClose,
  onSaved,
}: {
  post: BlogPost | null;
  onClose: () => void;
  onSaved: (p: BlogPost, isNew: boolean) => void;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? '');
  const [published, setPublished] = useState(post?.published ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadImage(file, 'blog');
    setUploading(false);
    if (url) setCoverUrl(url);
    if (error) alert('Upload failed: ' + error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const payload = {
      title: title.trim(),
      slug: slugify(title),
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      cover_url: coverUrl || null,
      published,
      updated_at: new Date().toISOString(),
    };

    if (post) {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', post.id)
        .select()
        .single();
      setBusy(false);
      if (!error && data) onSaved(data as BlogPost, false);
    } else {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(payload)
        .select()
        .single();
      setBusy(false);
      if (!error && data) onSaved(data as BlogPost, true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl p-7 glow-strong scrollbar-hide">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-white font-[Sora]">
          {post ? 'Edit post' : 'Write a new post'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Post title"
            />
          </FormField>

          <FormField label="Excerpt (short summary)">
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="A one or two line summary"
            />
          </FormField>

          <FormField label="Content">
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Write your post here..."
            />
          </FormField>

          <FormField label="Cover image">
            <div className="flex items-center gap-3">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt=""
                  className="w-20 h-16 rounded-lg object-cover border border-white/10"
                />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-300 glass rounded-lg hover:bg-white/[0.06] disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                Upload cover
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />
            </div>
          </FormField>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            Published (visible to visitors)
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-ink-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {post ? 'Save changes' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-300 glass rounded-lg hover:bg-white/[0.06]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
