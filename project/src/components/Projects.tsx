import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  ImageIcon,
  FolderGit2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/upload';
import { useReveal } from '@/lib/useReveal';
import { SectionHeading } from './About';
import type { Project } from '@/lib/types';

export function Projects() {
  const { user } = useAuth();
  const { ref, visible } = useReveal();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) setProjects((p) => p.filter((x) => x.id !== id));
  };

  const handleSaved = (p: Project, isNew: boolean) => {
    setProjects((prev) =>
      isNew ? [p, ...prev] : prev.map((x) => (x.id === p.id ? p : x))
    );
    setShowForm(false);
    setEditing(null);
  };

  return (
    <section id="projects" className="relative py-24 sm:py-32">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-5 sm:px-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <SectionHeading
          index="03"
          title="Projects"
          subtitle="A selection of data and programming work I've built."
        />

        {user && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="mt-6 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:from-emerald-300 hover:to-cyan-300 transition-all glow"
          >
            <Plus className="w-4 h-4" /> Add project
          </button>
        )}

        {loading ? (
          <div className="mt-12 flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                owner={!!user}
                delay={i * 70}
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
        <ProjectForm
          project={editing}
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

function EmptyState() {
  return (
    <div className="mt-12 glass rounded-2xl p-16 text-center">
      <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400">No projects yet.</p>
      <p className="text-sm text-slate-600 mt-1">
        Sign in as the owner to add your first project.
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  owner,
  delay,
  onEdit,
  onDelete,
}: {
  project: Project;
  owner: boolean;
  delay: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group glass card-3d rounded-2xl overflow-hidden animate-fade-up perspective-near"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-video bg-ink-850 overflow-hidden">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        {owner && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg bg-ink-950/70 backdrop-blur text-emerald-300 hover:bg-ink-950/90"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg bg-ink-950/70 backdrop-blur text-rose-300 hover:bg-ink-950/90"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-white font-medium font-[Sora] group-hover:text-emerald-300 transition-colors">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-3">{project.description}</p>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-xs text-emerald-200/80 bg-emerald-500/10 rounded-md border border-emerald-500/15"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {project.project_url && (
          <a
            href={project.project_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View project
          </a>
        )}
      </div>
    </div>
  );
}

function ProjectForm({
  project,
  onClose,
  onSaved,
}: {
  project: Project | null;
  onClose: () => void;
  onSaved: (p: Project, isNew: boolean) => void;
}) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [imageUrl, setImageUrl] = useState(project?.image_url ?? '');
  const [projectUrl, setProjectUrl] = useState(project?.project_url ?? '');
  const [tags, setTags] = useState((project?.tags ?? []).join(', '));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadImage(file, 'projects');
    setUploading(false);
    if (url) setImageUrl(url);
    if (error) alert('Upload failed: ' + error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      project_url: projectUrl.trim() || null,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      updated_at: new Date().toISOString(),
    };

    if (project) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', project.id)
        .select()
        .single();
      setBusy(false);
      if (!error && data) onSaved(data as Project, false);
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();
      setBusy(false);
      if (!error && data) onSaved(data as Project, true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass rounded-2xl p-7 glow-strong scrollbar-hide">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-white font-[Sora]">
          {project ? 'Edit project' : 'New project'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Project title"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Short description"
            />
          </FormField>

          <FormField label="Image">
            <div className="flex items-center gap-3">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border border-white/10"
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
                Upload
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

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Project URL (optional)">
              <input
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Tags (comma separated)">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputCls}
                placeholder="Python, SQL"
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-ink-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {project ? 'Save changes' : 'Add project'}
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
