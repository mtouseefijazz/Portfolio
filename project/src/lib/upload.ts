import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

export async function uploadImage(
  file: File,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}
