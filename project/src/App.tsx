import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { playNotificationSound, unlockAudio } from '@/lib/notify';
import type { Profile, Message } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Skills } from '@/components/Skills';
import { Projects } from '@/components/Projects';
import { Blog } from '@/components/Blog';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { AdminPanel } from '@/components/AdminPanel';

interface Toast {
  id: string;
  name: string;
  content: string;
}

function App() {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  // When the owner signs in for the first time, make sure a profile row exists.
  useEffect(() => {
    if (user && !profile) seedProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Listen for new visitor messages when admin is logged in but panel is closed
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('admin_toast_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'sender=eq.visitor' },
        (payload) => {
          const msg = payload.new as Message;
          // Only show toast + sound if admin panel is not open
          // (AdminPanel handles its own notifications when open)
          if (!adminOpen) {
            playNotificationSound('visitor');
            const toast: Toast = {
              id: msg.id,
              name: msg.visitor_name,
              content: msg.content,
            };
            setToasts((prev) => [...prev, toast]);
            // Auto-dismiss after 6 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 6000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, adminOpen]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profile')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const seedProfile = async () => {
    // Try to read again in case it was created since last check
    const { data: existing } = await supabase
      .from('profile')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (existing) {
      setProfile(existing as Profile);
      return;
    }
    const { data } = await supabase
      .from('profile')
      .insert({
        name: 'Muhammad Touseef Ejaz',
        tagline: 'Agentic & Generative AI Engineer',
        phone: '03223517968',
        email: 'mtouseefijazz@gmail.com',
        location: 'Pakistan',
      })
      .select()
      .single();
    if (data) setProfile(data as Profile);
  };

  const handleSignIn = () => {
    unlockAudio();
    setAuthOpen(true);
  };

  const handleAdminClick = () => {
    unlockAudio();
    setAdminOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-ink-950 overflow-x-hidden">
      <Navbar
        onSignInClick={handleSignIn}
        onAdminClick={handleAdminClick}
      />

      <main>
        <Hero
          profile={profile}
          onProfileUpdate={setProfile}
          onSignInRequired={() => setAuthOpen(true)}
        />
        <About profile={profile} onProfileUpdate={setProfile} />
        <Skills />
        <Projects />
        <Blog />
        <Contact profile={profile} />
      </main>

      <Footer name={profile?.name ?? 'Muhammad Touseef Ejaz'} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />

      {/* Floating toast notifications for admin */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3 max-w-sm animate-fade-in">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="glass rounded-2xl p-4 border border-emerald-500/20 bg-ink-900/90 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white font-[Sora]">
                    New message from {t.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{t.content}</p>
                  <button
                    onClick={() => {
                      dismissToast(t.id);
                      setAdminOpen(true);
                    }}
                    className="text-xs text-emerald-300 hover:text-emerald-200 mt-2 font-medium"
                  >
                    Open admin panel →
                  </button>
                </div>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="p-1 text-slate-500 hover:text-white shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
