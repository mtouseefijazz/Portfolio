import { useEffect, useState } from 'react';
import { Mail, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import type { EmailChange } from '@/lib/types';

export function EmailHistory() {
  const [changes, setChanges] = useState<EmailChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('account_email_history')
        .select('id, old_email, new_email, changed_at')
        .order('changed_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setChanges((data ?? []) as EmailChange[]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-5 h-5 text-cyan-300" />
        <h3 className="text-lg font-semibold text-white font-[Sora]">Previous emails</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>Could not load email history: {error}</p>
        </div>
      ) : changes.length === 0 ? (
        <p className="text-sm text-slate-500">No email changes yet.</p>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {changes.map((c) => (
            <li key={c.id} className="py-3 text-sm flex flex-wrap items-center justify-between gap-2">
              <p className="text-slate-300 break-all">
                <span className="text-slate-500">{c.old_email ?? 'none'}</span>
                <span className="text-slate-600 mx-2">to</span>
                <span className="text-white">{c.new_email ?? 'none'}</span>
              </p>
              <p className="text-xs text-slate-500">{formatDateTime(c.changed_at)}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">
        Passwords are never stored in readable form, so previous passwords cannot be shown.
      </p>
    </div>
  );
}
