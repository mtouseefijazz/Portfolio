import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getIcon } from '@/lib/icons';
import { SectionHeading } from './About';
import type { ContentItem } from '@/lib/types';

export function Skills() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [skills, setSkills] = useState<ContentItem[]>([]);
  const [tools, setTools] = useState<ContentItem[]>([]);
  const [learning, setLearning] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  const loadAll = async () => {
    setLoading(true);
    const [s, t, l] = await Promise.all([
      supabase.from('skills').select('*').order('sort_order', { ascending: true }),
      supabase.from('tools').select('*').order('sort_order', { ascending: true }),
      supabase.from('learning_items').select('*').order('sort_order', { ascending: true }),
    ]);
    setSkills((s.data ?? []) as ContentItem[]);
    setTools((t.data ?? []) as ContentItem[]);
    setLearning((l.data ?? []) as ContentItem[]);
    setLoading(false);
  };

  return (
    <section id="skills" className="relative py-24 sm:py-32">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-5 sm:px-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <SectionHeading
          index="02"
          title="Skills & Tools"
          subtitle="The technologies I use to explore, analyze, and visualize data."
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <>
            {/* Skills grid */}
            {skills.length > 0 && (
              <div className="mt-12">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-5">Skills</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((s, i) => {
                    const Icon = getIcon(s.icon_name);
                    return (
                      <div
                        key={s.id}
                        className="group glass card-3d rounded-2xl p-6 perspective-near"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="preserve-3d">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:border-white/10 transition-all">
                            <Icon className={`w-6 h-6 ${s.color}`} />
                          </span>
                          <div className="mt-4">
                            <h3 className="text-white font-medium font-[Sora]">{s.name}</h3>
                            {s.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tools */}
            {tools.length > 0 && (
              <div className="mt-12">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-5">Tools</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tools.map((t) => {
                    const Icon = getIcon(t.icon_name);
                    return (
                      <div
                        key={t.id}
                        className="group glass card-3d rounded-2xl p-5 flex flex-col items-center text-center perspective-near"
                      >
                        <div className="preserve-3d">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-3 group-hover:scale-110 transition-transform">
                            <Icon className={`w-7 h-7 ${t.color}`} />
                          </span>
                          <h3 className="text-sm text-white font-medium font-[Sora]">{t.name}</h3>
                          {t.description && (
                            <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Currently learning */}
            {learning.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-2 mb-5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  </span>
                  <p className="text-xs uppercase tracking-widest text-amber-300/80">
                    Currently learning
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {learning.map((l) => {
                    const Icon = getIcon(l.icon_name);
                    return (
                      <div
                        key={l.id}
                        className="group relative overflow-hidden glass card-3d rounded-2xl p-6 perspective-near"
                      >
                        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                        <div className="relative preserve-3d">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <Icon className={`w-6 h-6 ${l.color}`} />
                          </span>
                          <div className="mt-4">
                            <h3 className="text-white font-medium font-[Sora]">{l.name}</h3>
                            {l.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
