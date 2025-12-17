
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Vercel ENV'lerine eklenecek değişkenler:
// SUPABASE_URL: https://fhwxvajcfilbzqbrumrj.supabase.co
// SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3h2YWpjZmlsYnpxYnJ1bXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYxMDMsImV4cCI6MjA4MTU3MjEwM30.bduR0pxaNfthhHJ0vU60PQUEvtxpGgzAvXaedfXktNg

const supabaseUrl = process.env.SUPABASE_URL || 'https://fhwxvajcfilbzqbrumrj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3h2YWpjZmlsYnpxYnJ1bXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYxMDMsImV4cCI6MjA4MTU3MjEwM30.bduR0pxaNfthhHJ0vU60PQUEvtxpGgzAvXaedfXktNg';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadFile = async (bucket: string, file: File, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
};

export const uploadBlob = async (bucket: string, blob: Blob, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: 'image/png'
  });
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
};
