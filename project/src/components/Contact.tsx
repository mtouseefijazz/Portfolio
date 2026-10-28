import { useEffect, useRef, useState } from 'react';
import { Phone, Mail, MapPin, Github, Linkedin, Send, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useReveal } from '@/lib/useReveal';
import { playNotificationSound, requestNotificationPermission, showBrowserNotification } from '@/lib/notify';
import { SectionHeading } from './About';
import type { Profile, Message } from '@/lib/types';

const VISITOR_KEY = 'portfolio_visitor_id';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function Contact({ profile }: { profile: Profile | null }) {
  const { ref, visible } = useReveal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const phone = profile?.phone ?? '03223517968';
  const emailAddr = profile?.email ?? 'mtouseefijazz@gmail.com';
  const location = profile?.location ?? 'Pakistan';
  const github = profile?.github_url;
  const linkedin = profile?.linkedin_url;

  const visitorId = getVisitorId();

  // Load existing messages for this visitor and subscribe to new ones in real-time
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('visitor_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `visitor_id=eq.${visitorId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          // Play sound + browser notification when admin replies
          if (newMsg.sender === 'admin') {
            playNotificationSound('admin');
            showBrowserNotification('New reply from Admin', newMsg.content);
            if (!chatOpen) setChatOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitorId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    requestNotificationPermission();

    const visitorName = name.trim() || 'Visitor';
    const visitorEmail = email.trim() || 'not provided';

    const { data, error } = await supabase
      .from('messages')
      .insert({
        visitor_id: visitorId,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        sender: 'visitor',
        content: message.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      setMessage('');
      setSent(true);
      setChatOpen(true);
    }
    setSending(false);
  };

  const hasReplies = messages.some((m) => m.sender === 'admin');

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-5 sm:px-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <SectionHeading
          index="05"
          title="Get in touch"
          subtitle="Have a question or want to collaborate? Send a message and I'll reply in real-time."
        />

        <div className="mt-12 grid lg:grid-cols-2 gap-6">
          {/* Contact cards */}
          <div className="space-y-4">
            <a
              href={`tel:${phone}`}
              className="group flex items-center gap-4 p-5 glass glass-hover rounded-2xl"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 group-hover:bg-emerald-500/20 transition-all">
                <Phone className="w-6 h-6" />
              </span>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-white font-medium font-[Sora]">{phone}</p>
              </div>
            </a>

            <a
              href={`mailto:${emailAddr}`}
              className="group flex items-center gap-4 p-5 glass glass-hover rounded-2xl"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 group-hover:bg-cyan-500/20 transition-all">
                <Mail className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-white font-medium font-[Sora] truncate">{emailAddr}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 p-5 glass rounded-2xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300">
                <MapPin className="w-6 h-6" />
              </span>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-white font-medium font-[Sora]">{location}</p>
              </div>
            </div>

            {(github || linkedin) && (
              <div className="flex gap-3 pt-2">
                {github && (
                  <a
                    href={github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 glass glass-hover rounded-xl"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 glass glass-hover rounded-xl"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Chat / message form */}
          <div className="glass rounded-2xl p-7 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white font-[Sora]">Send a message</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Messages go straight to the admin. Replies appear here instantly.
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setChatOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 bg-emerald-500/10 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {chatOpen ? 'Hide chat' : 'View chat'}
                  {hasReplies && !chatOpen && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              )}
            </div>

            {/* Chat history */}
            {chatOpen && messages.length > 0 && (
              <div className="mt-4 max-h-64 overflow-y-auto space-y-3 p-4 bg-ink-850/50 rounded-xl border border-white/5 scrollbar-hide">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                        m.sender === 'visitor'
                          ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-500/20'
                          : 'bg-cyan-500/15 text-cyan-100 border border-cyan-500/20'
                      }`}
                    >
                      {m.sender === 'admin' && (
                        <p className="text-xs text-cyan-400 font-medium mb-0.5">Admin</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Form */}
            <form onSubmit={sendMessage} className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Your email (optional)"
                  className="w-full px-3.5 py-2.5 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                placeholder="Your message"
                className="w-full px-3.5 py-2.5 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-60 transition-all glow"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send message
              </button>
              {sent && (
                <p className="text-xs text-emerald-300 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message sent! Replies will appear here in real-time.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
