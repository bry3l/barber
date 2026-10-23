import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// Configuración pública: reemplaza la clave por la publishable/anon key de tu proyecto.
export const SUPABASE_URL = 'https://hzootrchiwfehljsyhlj.supabase.co/rest/v1/';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_35_2_0vyIogXOdG04K7FmA_QToir70-';
export const isSupabaseConfigured = !SUPABASE_PUBLISHABLE_KEY.startsWith('PEGA_AQUI');
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { db: { schema: 'barberia' } })
  : null;
export function requireSupabase() {
  if (!supabase) throw new Error('Configura la publishable key de Supabase en js/supabase.js.');
  return supabase;
}
