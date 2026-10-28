import { useRef, useState } from 'react';
import { Pencil, Check, X, Loader2, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useReveal } from '@/lib/useReveal';
import { databases } from '@/lib/content';
import type { Profile } from '@/lib/types';

interface AboutProps {
  profile: Profile | null;
  onProfileUpdate: (p: Profile) => void;
}

export function About({ profile, onProfileUpdate }: AboutProps) {
  const { user } = useAuth();
  const { ref, visible } = useReveal();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: profile?.name ?? 'Muhammad Touseef Ejaz',
    tagline: profile?.tagline ?? 'Data & Programming Enthusiast',
    bio: profile?.bio ?? '',
    phone: profile?.phone ?? '03223517968',
    email: profile?.email ?? 'mtouseefijazz@gmail.com',
    location: profile?.location ?? 'Pakistan',
    github_url: profile?.github_url ?? '',
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const startEdit = () => {
    setDraft({
      name: profile?.name ?? 'Muhammad Touseef Ejaz',
      tagline: profile?.tagline ?? 'Data & Programming Enthusiast',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '03223517968',
      email: profile?.email ?? 'mtouseefijazz@gmail.com',
      location: profile?.location ?? 'Pakistan',
      github_url: profile?.github_url ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profile')
      .update({ ...draft, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      onProfileUpdate(data as Profile);
      setEditing(false);
    }
  };

  const bioText =
    profile?.bio ||
    "I'm a data and programming enthusiast passionate about extracting meaning from data. I work with Python, SQL, and modern BI tools to build analyses, dashboards, and reproducible data workflows. I enjoy turning messy datasets into clean, visual stories that help people make better decisions.";

  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-5 sm:px-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <SectionHeading index="01" title="About me" />

        <div className="mt-12 grid lg:grid-cols-[1.5fr_1fr] gap-10">
          {/* Bio card */}
          <div className="relative glass rounded-2xl p-7 sm:p-9">
            {user && !editing && (
              <button
                onClick={startEdit}
                className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 bg-emerald-500/10 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            {editing ? (
              <div className="space-y-4">
                <Field label="Name">
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    value={draft.tagline}
                    onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Bio">
                  <textarea
                    rows={5}
                    value={draft.bio}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Phone">
                    <input
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="GitHub URL">
                    <input
                      value={draft.github_url}
                      onChange={(e) => setDraft({ ...draft, github_url: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 glass rounded-lg hover:bg-white/[0.06]"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-semibold text-white font-[Sora]">
                  {profile?.name ?? 'Muhammad Touseef Ejaz'}
                </h3>
                <p className="text-emerald-300 text-sm mt-1">
                  {profile?.tagline ?? 'Data & Programming Enthusiast'}
                </p>
                <p className="mt-5 text-slate-400 leading-relaxed">{bioText}</p>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                    Databases I use
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {databases.map((d) => (
                      <span
                        key={d}
                        className="px-3 py-1.5 text-sm text-slate-300 glass rounded-lg"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contact quick card */}
          <div className="glass rounded-2xl p-7 flex flex-col gap-4">
            <h4 className="text-sm uppercase tracking-widest text-slate-500">Quick contact</h4>
            <a
              href={`tel:${profile?.phone ?? '03223517968'}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 group-hover:bg-emerald-500/20">
                <Phone className="w-5 h-5" />
              </span>
              <span className="text-sm text-slate-300">{profile?.phone ?? '03223517968'}</span>
            </a>
            <a
              href={`mailto:${profile?.email ?? 'mtouseefijazz@gmail.com'}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300 group-hover:bg-cyan-500/20">
                <Mail className="w-5 h-5" />
              </span>
              <span className="text-sm text-slate-300 break-all">
                {profile?.email ?? 'mtouseefijazz@gmail.com'}
              </span>
            </a>
            <div className="flex items-center gap-3 p-3 rounded-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300">
                <MapPin className="w-5 h-5" />
              </span>
              <span className="text-sm text-slate-300">
                {profile?.location ?? 'Pakistan'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function SectionHeading({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <span className="text-xs font-mono text-emerald-400/70 tracking-widest">
          {index} ——
        </span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold font-[Sora] text-white text-balance">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-slate-400 max-w-xl">{subtitle}</p>}
      </div>
    </div>
  );
}
