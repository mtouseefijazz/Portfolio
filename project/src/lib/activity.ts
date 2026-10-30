import { supabase } from '@/lib/supabase';

export type ActivityAction = 'login' | 'logout' | 'page_view';

export async function logActivity(action: ActivityAction, page?: string) {
  const { error } = await supabase
    .from('activity_logs')
    .insert({ action, page: page ?? null });
  if (error) console.warn('Activity log failed:', error.message);
}
