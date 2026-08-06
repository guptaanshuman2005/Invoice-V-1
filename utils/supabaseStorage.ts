import { supabase } from '../supabase';

export const uploadFileToSupabase = async (
  file: File,
  bucket: string,
  path: string
): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('User not authenticated');
      return null;
    }
    const userId = session.user.id;
    const securePath = `${userId}/${path}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(securePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(securePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Unexpected error during file upload:', err);
    return null;
  }
};
