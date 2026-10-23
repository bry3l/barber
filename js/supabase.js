import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL =
  'https://hzootrchiwfehljsyhlj.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_35_2_0vyIogXOdG04K7FmA_QToir70-';

export const isSupabaseConfigured =
  Boolean(
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    !SUPABASE_PUBLISHABLE_KEY.startsWith('PEGA_AQUI')
  );

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      db: { schema: 'barberia' }
    })
  : null;
