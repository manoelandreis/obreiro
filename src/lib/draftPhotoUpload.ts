import { supabase } from '@/integrations/supabase/client';
import type { DraftPhoto } from '@/components/app/quote-new/PhotosSection';

export async function uploadDraftPhotos(userId: string, quoteId: string, photos: DraftPhoto[]) {
  const failed: DraftPhoto[] = [];
  for (const [index, photo] of photos.entries()) {
    const extension = photo.file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `${userId}/${quoteId}/${crypto.randomUUID()}.${extension}`;
    try {
      const { error: uploadError } = await supabase.storage.from('quote-attachments').upload(path, photo.file, { contentType: photo.file.type });
      if (uploadError) {
        failed.push(photo);
        continue;
      }
      const { error } = await supabase.from('quote_attachments').insert({
        quote_id: quoteId,
        user_id: userId,
        type: 'photo',
        storage_path: path,
        caption: photo.caption.trim() || null,
        sort_order: index,
      });
      if (error) {
        await supabase.storage.from('quote-attachments').remove([path]);
        failed.push(photo);
      }
    } catch {
      failed.push(photo);
    }
  }
  return failed;
}