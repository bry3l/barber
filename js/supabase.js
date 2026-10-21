import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://hzootrchiwfehljsyhlj.supabase.co',
  'sb_publishable_35_2_0vyIogXOdG04K7FmA_QToir70-',
  {
    db: {
      schema: 'barberia'
    }
  }
);
