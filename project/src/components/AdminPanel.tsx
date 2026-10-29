import { useEffect, useRef, useState } from 'react';
import {
  X,
  FolderGit2,
  PenLine,
  UserCircle,
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Loader2,
  ArrowUpRight,
  Wrench,
  GraduationCap,
  Sparkles,
  Shield,
  KeyRound,
  Mail,
  Check,
  MessageCircle,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/upload';
import { iconNames, colorOptions, getIcon } from '@/lib/icons';
import { playNotificationSound, requestNotificationPermission, showBrowserNotification } from '@/lib/notify';
import type { Project, BlogPost, Profile, ContentItem, Message } from '@/lib/types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab =
  | 'overview'
  | 'projects'
  | 'blog'
  | 'skills'
  | 'tools'
  | 'learning'
  | 'messages'
  | 'profile'
  | 'account';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [skills, setSkills] = useState<ContentItem[]>([]);
  const [tools, setTools] = useState<ContentItem[]>([]);
  const [learning, setLearning] = useState<ContentItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) loadAll();
  }, [open, user]);

  // Real-time subscription for unread messages count + notifications
  useEffect(() => {
    if (!open || !user) return;
    requestNotificationPermission();
    loadUnreadCount();
    const channel = supabase
      .channel('admin_unread_count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'sender=eq.visitor' },
        (payload) => {
          loadUnreadCount();
          const msg = payload.new as Message;
          playNotificationSound('visitor');
          showBrowserNotification(`New message from ${msg.visitor_name}`, msg.content);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => loadUnreadCount()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, user]);

  const loadUnreadCount = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender', 'visitor')
      .is('read_at', null);
    setUnreadCount(count ?? 0);
  };

  const loadAll = async () => {
    setLoading(true);
    const [p, b, pr, s, t, l] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('profile').select('*').limit(1).maybeSingle(),
      supabase.from('skills').select('*').order('sort_order', { ascending: true }),
      supabase.from('tools').select('*').order('sort_order', { ascending: true }),
      supabase.from('learning_items').select('*').order('sort_order', { ascending: true }),
    ]);
    setProjects((p.data ?? []) as Project[]);
    setPosts((b.data ?? []) as BlogPost[]);
    setProfile((pr.data ?? null) as Profile | null);
    setSkills((s.data ?? []) as ContentItem[]);
    setTools((t.data ?? []) as ContentItem[]);
    setLearning((l.data ?? []) as ContentItem[]);
    setLoading(false);
  };

  if (!open || !user || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[70] animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative h-full flex flex-col">
        {/* Top bar */}
        <div className="border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-ink-950 font-bold text-sm font-[Sora]">
                MP
              </span>
              <div>
                <p className="text-white font-medium font-[Sora] leading-tight">Admin Panel</p>
                <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-4 self-start">
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-hide">
                <TabBtn id="overview" tab={tab} setTab={setTab} icon={ArrowUpRight} label="Overview" />
                <TabBtn id="projects" tab={tab} setTab={setTab} icon={FolderGit2} label="Projects" count={projects.length} />
                <TabBtn id="blog" tab={tab} setTab={setTab} icon={PenLine} label="Blog posts" count={posts.length} />
                <TabBtn id="skills" tab={tab} setTab={setTab} icon={Wrench} label="Skills" count={skills.length} />
                <TabBtn id="tools" tab={tab} setTab={setTab} icon={Sparkles} label="Tools" count={tools.length} />
                <TabBtn id="learning" tab={tab} setTab={setTab} icon={GraduationCap} label="Learning" count={learning.length} />
                <TabBtn id="messages" tab={tab} setTab={setTab} icon={MessageCircle} label="Messages" count={unreadCount || undefined} />
                <TabBtn id="profile" tab={tab} setTab={setTab} icon={UserCircle} label="Profile" />
                <TabBtn id="account" tab={tab} setTab={setTab} icon={Shield} label="Account" />
              </nav>
            </aside>

            {/* Content */}
            <div className="min-w-0">
              {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  {tab === 'overview' && (
                    <Overview
                      projects={projects.length}
                      posts={posts.length}
                      skillsCount={skills.length}
                      toolsCount={tools.length}
                      learningCount={learning.length}
                      profile={profile}
                      setTab={setTab}
                    />
                  )}
                  {tab === 'projects' && (
                    <ProjectsManager projects={projects} onChange={loadAll} />
                  )}
                  {tab === 'blog' && <BlogManager posts={posts} onChange={loadAll} />}
                  {tab === 'skills' && (
                    <ContentManager
                      title="Skills"
                      items={skills}
                      table="skills"
                      onChange={loadAll}
                    />
                  )}
                  {tab === 'tools' && (
                    <ContentManager
                      title="Tools"
                      items={tools}
                      table="tools"
                      onChange={loadAll}
                    />
                  )}
                  {tab === 'learning' && (
                    <ContentManager
                      title="Currently Learning"
                      items={learning}
                      table="learning_items"
                      onChange={loadAll}
                    />
                  )}
                  {tab === 'messages' && <MessagesManager onReadChange={loadUnreadCount} />}
                  {tab === 'profile' && (
                    <ProfileManager profile={profile} onChange={loadAll} />
                  )}
                  {tab === 'account' && <AccountManager />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  id,
  tab,
  setTab,
  icon: Icon,
  label,
  count,
}: {
  id: Tab;
  tab: Tab;
  setTab: (t: Tab) => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  const active = tab === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
        active
          ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/25'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && (
        <span className="ml-auto text-xs text-slate-500">{count}</span>
      )}
    </button>
  );
}

/* ─────────────── Overview ─────────────── */
function Overview({
  projects,
  posts,
  skillsCount,
  toolsCount,
  learningCount,
  profile,
  setTab,
}: {
  projects: number;
  posts: number;
  skillsCount: number;
  toolsCount: number;
  learningCount: number;
  profile: Profile | null;
  setTab: (t: Tab) => void;
}) {
  const stats = [
    { label: 'Projects', value: projects, tab: 'projects' as Tab, icon: FolderGit2 },
    { label: 'Blog posts', value: posts, tab: 'blog' as Tab, icon: PenLine },
    { label: 'Skills', value: skillsCount, tab: 'skills' as Tab, icon: Wrench },
    { label: 'Tools', value: toolsCount, tab: 'tools' as Tab, icon: Sparkles },
    { label: 'Learning', value: learningCount, tab: 'learning' as Tab, icon: GraduationCap },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-[Sora]">Welcome back</h2>
        <p className="text-slate-400 mt-1">Full control of your portfolio from one place.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab)}
            className="group glass glass-hover rounded-2xl p-6 text-left perspective-near"
          >
            <div className="preserve-3d">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 mb-4">
                <s.icon className="w-6 h-6" />
              </span>
              <p className="text-3xl font-bold text-white font-[Sora]">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              <p className="text-xs text-emerald-300 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Manage <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
          </button>
        ))}
      </div>

      {profile && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 bg-ink-850">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold gradient-text font-[Sora]">
                  {profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium font-[Sora] truncate">{profile.name}</p>
              <p className="text-sm text-emerald-300">{profile.tagline}</p>
              <p className="text-xs text-slate-500 mt-1 truncate">{profile.email}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setTab('profile')}
              className="text-sm text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
            >
              Edit profile <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTab('account')}
              className="text-sm text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              Account settings <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Content manager (skills/tools/learning) ─────────────── */
function ContentManager({
  title,
  items,
  table,
  onChange,
}: {
  title: string;
  items: ContentItem[];
  table: string;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${title.toLowerCase().replace('currently ', '')} item?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) onChange();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white font-[Sora]">{title}</h2>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg hover:from-emerald-300 hover:to-cyan-300 transition-all"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyHint text={`No ${title.toLowerCase()} yet. Add your first one.`} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = getIcon(item.icon_name);
            return (
              <div key={item.id} className="group flex items-center gap-4 p-4 glass glass-hover rounded-xl">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditing(item);
                      setCreating(true);
                    }}
                    className="p-2 text-emerald-300 rounded-lg hover:bg-white/[0.06]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-rose-300 rounded-lg hover:bg-white/[0.06]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <ContentEditor
          item={editing}
          table={table}
          title={title}
          maxOrder={items.length}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function ContentEditor({
  item,
  table,
  title,
  maxOrder,
  onClose,
  onSaved,
}: {
  item: ContentItem | null;
  table: string;
  title: string;
  maxOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [iconName, setIconName] = useState(item?.icon_name ?? 'Code2');
  const [color, setColor] = useState(item?.color ?? 'text-sky-400');
  const [busy, setBusy] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = iconNames.filter((n) =>
    n.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      icon_name: iconName,
      color,
      sort_order: item?.sort_order ?? maxOrder + 1,
    };
    if (item) {
      await supabase.from(table).update(payload).eq('id', item.id);
    } else {
      await supabase.from(table).insert(payload);
    }
    setBusy(false);
    onSaved();
  };

  return (
    <ModalShell title={item ? `Edit ${title}` : `Add ${title}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="e.g. Python" />
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inp} placeholder="Short description" />
        </Field>

        {/* Icon picker */}
        <Field label="Icon">
          <input
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            className={`${inp} mb-3`}
            placeholder="Search icons..."
          />
          <div className="max-h-40 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-ink-850 rounded-xl border border-white/10 scrollbar-hide">
            {filteredIcons.map((iconNameOpt) => {
              const Icon = getIcon(iconNameOpt);
              const selected = iconNameOpt === iconName;
              return (
                <button
                  key={iconNameOpt}
                  type="button"
                  onClick={() => setIconName(iconNameOpt)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                    selected
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title={iconNameOpt}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </Field>

        {/* Color picker */}
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  color === c ? 'ring-2 ring-white/40 scale-110' : 'hover:scale-105'
                } ${c} bg-white/[0.03] border border-white/[0.06]`}
              >
                {color === c && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </Field>

        {/* Preview */}
        <div className="flex items-center gap-3 p-4 bg-ink-850 rounded-xl border border-white/10">
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] ${color}`}>
            {(() => { const Icon = getIcon(iconName); return <Icon className="w-6 h-6" />; })()}
          </span>
          <div>
            <p className="text-white text-sm font-medium font-[Sora]">{name || 'Preview'}</p>
            <p className="text-xs text-slate-500">{description || 'Description preview'}</p>
          </div>
        </div>

        <SaveRow busy={busy} onSave={save} onCancel={onClose} label={item ? 'Save changes' : 'Add'} />
      </div>
    </ModalShell>
  );
}

/* ─────────────── Messages manager (real-time chat) ─────────────── */
interface Conversation {
  visitor_id: string;
  visitor_name: string;
  visitor_email: string;
  last_message: string;
  last_at: string;
  unread: number;
  messages: Message[];
}

function MessagesManager({ onReadChange }: { onReadChange: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeVisitor, setActiveVisitor] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('admin_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.visitor_id === msg.visitor_id);
            if (idx === -1) {
              // New conversation
              loadConversations();
              return prev;
            }
            const updated = [...prev];
            const conv = { ...updated[idx] };
            conv.messages = [...conv.messages, msg].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            conv.last_message = msg.content;
            conv.last_at = msg.created_at;
            if (msg.sender === 'visitor' && activeVisitor !== msg.visitor_id) {
              conv.unread = conv.unread + 1;
            }
            updated[idx] = conv;
            return updated;
          });
          if (msg.sender === 'visitor') {
            onReadChange();
            playNotificationSound('visitor');
            showBrowserNotification(`New message from ${msg.visitor_name}`, msg.content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeVisitor]);

  useEffect(() => {
    if (activeVisitor) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, activeVisitor]);

  const loadConversations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (!data) {
      setLoading(false);
      return;
    }
    const allMsgs = data as Message[];
    const grouped: Record<string, Conversation> = {};
    for (const msg of allMsgs) {
      if (!grouped[msg.visitor_id]) {
        grouped[msg.visitor_id] = {
          visitor_id: msg.visitor_id,
          visitor_name: msg.visitor_name,
          visitor_email: msg.visitor_email,
          last_message: msg.content,
          last_at: msg.created_at,
          unread: 0,
          messages: [],
        };
      }
      grouped[msg.visitor_id].messages.push(msg);
      if (new Date(msg.created_at).getTime() > new Date(grouped[msg.visitor_id].last_at).getTime()) {
        grouped[msg.visitor_id].last_message = msg.content;
        grouped[msg.visitor_id].last_at = msg.created_at;
      }
      if (msg.sender === 'visitor' && msg.read_at === null) {
        grouped[msg.visitor_id].unread += 1;
      }
    }
    const list = Object.values(grouped).sort(
      (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
    );
    setConversations(list);
    setLoading(false);
  };

  const openConversation = async (visitorId: string) => {
    setActiveVisitor(visitorId);
    // Mark visitor messages as read
    const conv = conversations.find((c) => c.visitor_id === visitorId);
    if (conv) {
      const unreadIds = conv.messages
        .filter((m) => m.sender === 'visitor' && m.read_at === null)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
        setConversations((prev) =>
          prev.map((c) =>
            c.visitor_id === visitorId ? { ...c, unread: 0 } : c
          )
        );
        onReadChange();
      }
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeVisitor) return;
    setSending(true);
    const conv = conversations.find((c) => c.visitor_id === activeVisitor);
    const { data, error } = await supabase
      .from('messages')
      .insert({
        visitor_id: activeVisitor,
        visitor_name: conv?.visitor_name ?? 'Visitor',
        visitor_email: conv?.visitor_email ?? 'unknown',
        sender: 'admin',
        content: reply.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setConversations((prev) =>
        prev.map((c) =>
          c.visitor_id === activeVisitor
            ? {
                ...c,
                messages: [...c.messages, data as Message].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ),
                last_message: (data as Message).content,
                last_at: (data as Message).created_at,
              }
            : c
        )
      );
      setReply('');
    }
    setSending(false);
  };

  const deleteConversation = async (visitorId: string) => {
    if (!confirm('Delete this entire conversation?')) return;
    const { error } = await supabase.from('messages').delete().eq('visitor_id', visitorId);
    if (!error) {
      setConversations((prev) => prev.filter((c) => c.visitor_id !== visitorId));
      if (activeVisitor === visitorId) setActiveVisitor(null);
      onReadChange();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.visitor_id === activeVisitor);

  // Chat view — single conversation
  if (activeConv) {
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setActiveVisitor(null)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium font-[Sora] truncate">{activeConv.visitor_name}</p>
            <p className="text-xs text-slate-500 truncate">{activeConv.visitor_email}</p>
          </div>
          <button
            onClick={() => deleteConversation(activeConv.visitor_id)}
            className="p-2 text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-ink-850/50 rounded-xl border border-white/5 scrollbar-hide">
          {activeConv.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm ${
                  m.sender === 'admin'
                    ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-500/20'
                    : 'bg-white/[0.04] text-slate-200 border border-white/[0.06]'
                }`}
              >
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

        {/* Reply input */}
        <div className="mt-4 flex items-center gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-3 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            onClick={sendReply}
            disabled={sending || !reply.trim()}
            className="flex items-center justify-center w-12 h-12 text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-60 transition-all shrink-0"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div>
      <h2 className="text-2xl font-bold text-white font-[Sora] mb-6">Messages</h2>
      {conversations.length === 0 ? (
        <EmptyHint text="No messages yet. When visitors send you a message, it will appear here in real-time." />
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <button
              key={c.visitor_id}
              onClick={() => openConversation(c.visitor_id)}
              className="group w-full flex items-center gap-4 p-4 glass glass-hover rounded-xl text-left"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 shrink-0">
                <MessageCircle className="w-6 h-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">{c.visitor_name}</p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center px-1.5 text-xs font-bold text-ink-950 bg-emerald-400 rounded-full">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {new Date(c.last_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Account manager ─────────────── */
function AccountManager() {
  const { user, signOut } = useAuth();
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const updateEmail = async () => {
    setEmailMsg(null);
    if (!newEmail.trim() || newEmail.trim() === user?.email) {
      setEmailMsg({ type: 'err', text: 'Enter a new email address.' });
      return;
    }
    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailBusy(false);
    if (error) {
      setEmailMsg({ type: 'err', text: error.message });
    } else {
      setEmailMsg({
        type: 'ok',
        text: 'Email update requested. You may need to confirm the new email.',
      });
    }
  };

  const updatePassword = async () => {
    setPassMsg(null);
    if (newPassword.length < 6) {
      setPassMsg({ type: 'err', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'err', text: 'Passwords do not match.' });
      return;
    }
    setPassBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPassBusy(false);
    if (error) {
      setPassMsg({ type: 'err', text: error.message });
    } else {
      setPassMsg({ type: 'ok', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-[Sora]">Account settings</h2>
        <p className="text-slate-400 mt-1">
          You are the admin. Change your login email or password here.
        </p>
      </div>

      {/* Current account info */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <Shield className="w-6 h-6" />
          </span>
          <div>
            <p className="text-white font-medium font-[Sora]">Admin account</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <p className="text-xs text-emerald-300 mt-0.5">Full control · first registered user is admin</p>
          </div>
        </div>
      </div>

      {/* Change email */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-cyan-300" />
          <h3 className="text-lg font-semibold text-white font-[Sora]">Change email</h3>
        </div>
        <Field label="New email address">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={inp}
            placeholder="your-new-email@gmail.com"
          />
        </Field>
        {emailMsg && (
          <p className={`text-sm rounded-lg px-3 py-2 ${
            emailMsg.type === 'ok'
              ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
          }`}>
            {emailMsg.text}
          </p>
        )}
        <button
          onClick={updateEmail}
          disabled={emailBusy}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 disabled:opacity-60 transition-all"
        >
          {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Update email
        </button>
      </div>

      {/* Change password */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-300" />
          <h3 className="text-lg font-semibold text-white font-[Sora]">Change password</h3>
        </div>
        <Field label="New password">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inp}
            placeholder="At least 6 characters"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inp}
            placeholder="Repeat new password"
          />
        </Field>
        {passMsg && (
          <p className={`text-sm rounded-lg px-3 py-2 ${
            passMsg.type === 'ok'
              ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
          }`}>
            {passMsg.text}
          </p>
        )}
        <button
          onClick={updatePassword}
          disabled={passBusy}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-60 transition-all"
        >
          {passBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Update password
        </button>
      </div>

      {/* Sign out */}
      <div className="glass rounded-2xl p-6">
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-rose-300 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 border border-rose-500/20 transition-all"
        >
          <X className="w-4 h-4" /> Sign out of admin account
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Projects manager ─────────────── */
function ProjectsManager({
  projects,
  onChange,
}: {
  projects: Project[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) onChange();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white font-[Sora]">Projects</h2>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg hover:from-emerald-300 hover:to-cyan-300 transition-all"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyHint text="No projects yet. Add your first one." />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group flex items-center gap-4 p-4 glass glass-hover rounded-xl"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-ink-850 shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{p.title}</p>
                {p.description && (
                  <p className="text-xs text-slate-500 truncate">{p.description}</p>
                )}
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditing(p);
                    setCreating(true);
                  }}
                  className="p-2 text-emerald-300 rounded-lg hover:bg-white/[0.06]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-rose-300 rounded-lg hover:bg-white/[0.06]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <ProjectEditor
          project={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function ProjectEditor({
  project,
  onClose,
  onSaved,
}: {
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
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

  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      project_url: projectUrl.trim() || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    if (project) {
      await supabase.from('projects').update(payload).eq('id', project.id);
    } else {
      await supabase.from('projects').insert(payload);
    }
    setBusy(false);
    onSaved();
  };

  return (
    <ModalShell title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="Project title" />
        </Field>
        <Field label="Description">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inp} resize-none`} placeholder="Short description" />
        </Field>
        <Field label="Image">
          <UploadRow imageUrl={imageUrl} uploading={uploading} onPick={fileRef} onChange={handleImage} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Project URL (optional)">
            <input value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} className={inp} placeholder="https://..." />
          </Field>
          <Field label="Tags (comma separated)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={inp} placeholder="Python, SQL" />
          </Field>
        </div>
        <SaveRow busy={busy} onSave={save} onCancel={onClose} label={project ? 'Save changes' : 'Add project'} />
      </div>
    </ModalShell>
  );
}

/* ─────────────── Blog manager ─────────────── */
function BlogManager({ posts, onChange }: { posts: BlogPost[]; onChange: () => void }) {
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (!error) onChange();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white font-[Sora]">Blog posts</h2>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg hover:from-emerald-300 hover:to-cyan-300 transition-all"
        >
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      {posts.length === 0 ? (
        <EmptyHint text="No posts yet. Write your first one." />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="group flex items-center gap-4 p-4 glass glass-hover rounded-xl">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-ink-850 shrink-0">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{p.title}</p>
                {p.excerpt && <p className="text-xs text-slate-500 truncate">{p.excerpt}</p>}
                <p className="text-xs text-slate-600 mt-0.5">
                  {new Date(p.created_at).toLocaleDateString()}{' '}
                  {!p.published && <span className="text-amber-400">· Draft</span>}
                </p>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditing(p);
                    setCreating(true);
                  }}
                  className="p-2 text-emerald-300 rounded-lg hover:bg-white/[0.06]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-rose-300 rounded-lg hover:bg-white/[0.06]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <PostEditor
          post={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function PostEditor({
  post,
  onClose,
  onSaved,
}: {
  post: BlogPost | null;
  onClose: () => void;
  onSaved: () => void;
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
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadImage(file, 'blog');
    setUploading(false);
    if (url) setCoverUrl(url);
    if (error) alert('Upload failed: ' + error);
  };

  const save = async () => {
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
      await supabase.from('blog_posts').update(payload).eq('id', post.id);
    } else {
      await supabase.from('blog_posts').insert(payload);
    }
    setBusy(false);
    onSaved();
  };

  return (
    <ModalShell title={post ? 'Edit post' : 'Write a new post'} onClose={onClose} wide>
      <div className="space-y-4">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="Post title" />
        </Field>
        <Field label="Excerpt">
          <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={`${inp} resize-none`} placeholder="Short summary" />
        </Field>
        <Field label="Content">
          <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} className={`${inp} resize-none`} placeholder="Write your post..." />
        </Field>
        <Field label="Cover image">
          <UploadRow imageUrl={coverUrl} uploading={uploading} onPick={fileRef} onChange={handleImage} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 rounded accent-emerald-500" />
          Published (visible to visitors)
        </label>
        <SaveRow busy={busy} onSave={save} onCancel={onClose} label={post ? 'Save changes' : 'Publish'} />
      </div>
    </ModalShell>
  );
}

/* ─────────────── Profile manager ─────────────── */
function ProfileManager({
  profile,
  onChange,
}: {
  profile: Profile | null;
  onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    name: profile?.name ?? 'Muhammad Touseef Ejaz',
    tagline: profile?.tagline ?? 'Agentic & Generative AI Engineer',
    bio: profile?.bio ?? '',
    phone: profile?.phone ?? '03223517968',
    email: profile?.email ?? 'mtouseefijazz@gmail.com',
    location: profile?.location ?? 'Pakistan',
    github_url: profile?.github_url ?? '',
    linkedin_url: profile?.linkedin_url ?? '',
    photo_url: profile?.photo_url ?? '',
  });

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadImage(file, 'profile');
    setUploading(false);
    if (url) setDraft((d) => ({ ...d, photo_url: url }));
    if (error) alert('Upload failed: ' + error);
  };

  const save = async () => {
    setBusy(true);
    if (profile) {
      await supabase
        .from('profile')
        .update({ ...draft, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
    } else {
      await supabase.from('profile').insert(draft);
    }
    setBusy(false);
    onChange();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white font-[Sora] mb-6">Profile</h2>
      <div className="glass rounded-2xl p-6 space-y-4">
        <Field label="Profile photo">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-ink-850">
              {draft.photo_url ? (
                <img src={draft.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold gradient-text font-[Sora]">
                  MTE
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-300 glass rounded-lg hover:bg-white/[0.06] disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Upload photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inp} />
          </Field>
          <Field label="Tagline">
            <input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} className={inp} />
          </Field>
        </div>
        <Field label="Bio">
          <textarea rows={4} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className={`${inp} resize-none`} placeholder="Tell visitors about yourself" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inp} />
          </Field>
          <Field label="Email">
            <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inp} />
          </Field>
          <Field label="Location">
            <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className={inp} />
          </Field>
          <Field label="GitHub URL">
            <input value={draft.github_url} onChange={(e) => setDraft({ ...draft, github_url: e.target.value })} className={inp} placeholder="https://github.com/..." />
          </Field>
          <Field label="LinkedIn URL">
            <input value={draft.linkedin_url} onChange={(e) => setDraft({ ...draft, linkedin_url: e.target.value })} className={inp} placeholder="https://linkedin.com/in/..." />
          </Field>
        </div>

        <SaveRow busy={busy} onSave={save} onCancel={onChange} label="Save profile" />
      </div>
    </div>
  );
}

/* ─────────────── Shared bits ─────────────── */
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center text-slate-500">
      <p>{text}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto glass rounded-2xl p-7 glow-strong scrollbar-hide`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-white font-[Sora] mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function UploadRow({
  imageUrl,
  uploading,
  onPick,
  onChange,
}: {
  imageUrl: string;
  uploading: boolean;
  onPick: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {imageUrl && <img src={imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10" />}
      <button
        type="button"
        onClick={() => onPick.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-300 glass rounded-lg hover:bg-white/[0.06] disabled:opacity-60"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        Upload
      </button>
      <input
        ref={onPick as React.RefObject<HTMLInputElement>}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}

function SaveRow({
  busy,
  onSave,
  onCancel,
  label,
}: {
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <button
        onClick={onSave}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-ink-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {label}
      </button>
      <button onClick={onCancel} className="px-4 py-2.5 text-sm text-slate-300 glass rounded-lg hover:bg-white/[0.06]">
        Cancel
      </button>
    </div>
  );
}

const inp =
  'w-full px-3.5 py-2.5 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all';
