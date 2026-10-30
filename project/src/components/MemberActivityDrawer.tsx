import { useEffect, useState } from 'react';
import { X, Loader2, Lock, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import type { Member } from '@/lib/types';

type ActionFilter = 'all' | 'login' | 'logout' | 'page_view';

interface ActivityRow {
  id: string;
  action: 'login' | 'logout' | 'page_view';
  page: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<ActivityRow['action'], string> = {
  login: 'Signed in',
  logout: 'Signed out',
  page_view: 'Viewed page',
};

const inp =
  'px-3 py-2 bg-ink-850 border border-white/10 rounded-lg text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all';

export function MemberActivityDrawer({ member, onClose }: { member: Member; onClose: () => void }) {
  const [action, setAction] = useState<ActionFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      let q = supabase
        .from('activity_logs')
        .select('id, action, page, created_at')
        .eq('user_id', member.id)
        .order('created_at', { ascending: false })
        .limit(300);
      if (action !== 'all') q = q.eq('action', action);
      if (from) q = q.gte('created_at', new Date(`${from}T00:00:00`).toISOString());
      if (to) q = q.lte('created_at', new Date(`${to}T23:59:59.999`).toISOString());
      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows((data ?? []) as ActivityRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [member.id, action, from, to]);

  const sendReset = async () => {
    setResetMsg(null);
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(member.email);
    setResetBusy(false);
    setResetMsg(
      error
        ? { type: 'err', text: error.message }
        : { type: 'ok', text: `Password reset link sent to ${member.email}.` }
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col glass rounded-2xl glow-strong">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/[0.06]">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-white font-[Sora] truncate">{member.email}</p>
            <p className="text-sm text-slate-400 mt-1">Joined {formatDateTime(member.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Lock className="w-4 h-4 text-emerald-300" /> Password
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Stored as a secure one-way hash. It cannot be viewed, even by the admin.
              </p>
              <button
                onClick={sendReset}
                disabled={resetBusy}
                className="mt-3 flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-60 transition-all"
              >
                {resetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send password reset email
              </button>
              {resetMsg && (
                <p
                  className={`text-xs mt-3 rounded-lg px-3 py-2 ${
                    resetMsg.type === 'ok'
                      ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
                  }`}
                >
                  {resetMsg.text}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Logins" value={member.login_count} />
              <Stat label="Pages visited" value={member.pages_visited} />
              <Stat label="Total actions" value={member.action_count} />
              <Stat label="Last login" value={formatDateTime(member.last_login_at)} small />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Action
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as ActionFilter)}
                  className={inp}
                >
                  <option value="all">All actions</option>
                  <option value="login">Signed in</option>
                  <option value="logout">Signed out</option>
                  <option value="page_view">Viewed page</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                From
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inp} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                To
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inp} />
              </label>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Could not load activity: {error}</p>
              </div>
            ) : rows.length === 0 ? (
              <p className="text-center text-slate-500 py-12">No activity matches these filters.</p>
            ) : (
              <ul className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden">
                {rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-white">{ACTION_LABELS[r.action]}</p>
                      {r.page && <p className="text-xs text-slate-500 truncate">{r.page}</p>}
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">{formatDateTime(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-white font-medium ${small ? 'text-xs mt-1' : 'text-lg'}`}>{value}</p>
    </div>
  );
}
