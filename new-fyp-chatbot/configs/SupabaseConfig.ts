// supabaseConfig.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mufvyfxxyfxwnoacgjie.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZnZ5Znh4eWZ4d25vYWNnamllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM5MDMwMjMsImV4cCI6MjAzOTQ3OTAyM30.Y1BtDDUMN1JIjnDJYREgVqYgTaOQsjePxG40FIhSZBA';

export const supabase = createClient(
  (supabaseUrl as string) ?? '',
  (supabaseAnonKey as string) ?? '',
);

export default supabase;
