import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://hzootrchiwfehljsyhlj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_35_2_0vyIogXOdG04K7FmA_QToir70-';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'barberia'
    }
  }
);
