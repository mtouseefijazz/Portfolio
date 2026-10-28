import { useRef, useState } from 'react';
import { Camera, Download, MapPin, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface HeroProps {
  profile: Profile | null;
  onProfileUpdate: (p: Profile) => void;
  onSignInRequired: () => void;
}

export function Hero({ profile, onProfileUpdate, onSignInRequired }: HeroProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const name = profile?.name ?? 'Muhammad Touseef Ejaz';
  const tagline = profile?.tagline ?? 'Data & Programming Enthusiast';
  const photoUrl = profile?.photo_url ?? null;

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!user) {
      onSignInRequired();
      return;
    }
    setUploading(true);
    const { url, error } = await uploadImage(file, 'profile');
    if (url) {
      const { data, error: upErr } = await supabase
        .from('profile')
        .update({ photo_url: url, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();
      if (!upErr && data) onProfileUpdate(data as Profile);
    }
    setUploading(false);
    if (error) alert('Upload failed: ' + error);
    if (e.target) e.target.value = '';
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden"
    >
      {/* Background grid + glows */}
      <div className="absolute inset-0 grid-bg radial-fade" />
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
        {/* Left: text */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs text-emerald-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Available for opportunities
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[Sora] leading-[1.1] text-balance">
            <span className="text-white">Hi, I'm </span>
            <span className="gradient-text">{name}</span>
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/25 text-emerald-200 text-sm font-medium font-[Sora]">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Agentic &amp; Generative AI Engineer
          </div>

          <p className="mt-5 text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed">
            {tagline}. I work with <span className="text-emerald-300">Python</span>,{' '}
            <span className="text-emerald-300">SQL</span>, and{' '}
            <span className="text-emerald-300">data tools</span> to turn raw data into
            clear, actionable insight.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="px-5 py-3 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:from-emerald-300 hover:to-cyan-300 transition-all glow"
            >
              View my work
            </a>
            <a
              href="#contact"
              className="px-5 py-3 text-sm font-medium text-white glass glass-hover rounded-xl"
            >
              Get in touch
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Pakistan
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="w-4 h-4" /> MySQL · PostgreSQL
            </span>
          </div>
        </div>

        {/* Right: photo */}
        <div className="flex justify-center lg:justify-end animate-fade-up perspective" style={{ animationDelay: '0.15s' }}>
          <div className="relative group photo-3d preserve-3d">
            {/* Decorative ring */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-500/20 via-transparent to-cyan-500/20 blur-2xl animate-pulse-glow" />
            <div className="absolute -inset-2 rounded-full border border-emerald-500/20 animate-[spin_18s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
            <div className="absolute -inset-6 rounded-full border border-cyan-500/10 animate-[spin_26s_linear_infinite_reverse]" style={{ borderStyle: 'dotted' }} />

            <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden border-2 border-white/10 bg-ink-850 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] preserve-3d">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-bold gradient-text font-[Sora]">
                  {name.split(' ').map((n) => n[0]).slice(0, 3).join('')}
                </div>
              )}
            </div>

            <button
              onClick={() => (user ? fileRef.current?.click() : onSignInRequired())}
              disabled={uploading}
              className="absolute bottom-3 right-3 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-ink-950 hover:bg-emerald-400 disabled:opacity-60 transition-all glow z-10"
              title={user ? 'Change photo' : 'Sign in to upload photo'}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-600 hover:text-emerald-300 transition-colors"
        aria-label="Scroll down"
      >
        <div className="w-6 h-10 rounded-full border-2 border-current flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-current animate-bounce" />
        </div>
      </a>
    </section>
  );
}
