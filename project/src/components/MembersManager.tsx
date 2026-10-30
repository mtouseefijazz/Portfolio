import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Shield, Users, Activity, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import type { Member } from '@/lib/types';
import { MemberActivityDrawer } from '@/components/MemberActivityDrawer';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function MembersManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase.rpc('admin_list_members');
    if (error) {
      setError(error.message);
    } else if (Array.isArray(data)) {
      setMembers(data as Member[]);
    } else {
      setError('Unexpected response from the server.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin_members_activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const activeThisWeek = useMemo(
    () =>
      members.filter(
        (m) => m.last_login_at && Date.now() - new Date(m.last_login_at).getTime() < WEEK_MS
      ).length,
    [members]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? members.filter((m) => m.email.toLowerCase().includes(q)) : members;
  }, [members, query]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-[Sora]">Members</h2>
        <p className="text-slate-400 mt-1">Everyone who has signed up, with their activity.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total members" value={members.length} />
        <StatCard icon={Activity} label="Active in last 7 days" value={activeThisWeek} />
        <StatCard
          icon={Shield}
          label="Admin"
          value={members.find((m) => m.is_admin)?.email ?? '-'}
          small
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="w-full pl-10 pr-4 py-3 bg-ink-850 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>Could not load members: {error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">No members match your search.</p>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-white/[0.06]">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Logins</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3 font-medium text-right">Pages visited</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-5 py-3.5 text-white">
                    <span className="flex items-center gap-2">
                      {m.email}
                      {m.is_admin && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                          Admin
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{formatDateTime(m.created_at)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-300">{m.login_count}</td>
                  <td className="px-5 py-3.5 text-slate-400">{formatDateTime(m.last_login_at)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-300">{m.pages_visited}</td>
                  <td className="px-5 py-3.5 text-right text-slate-300">{m.action_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <MemberActivityDrawer member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  small?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 mb-3">
        <Icon className="w-5 h-5" />
      </span>
      <p className={`font-bold text-white font-[Sora] truncate ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}
