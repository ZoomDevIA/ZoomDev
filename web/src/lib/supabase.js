import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const chave = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

// Até as variáveis públicas existirem, a tela continua no login legado.
export const supabaseAtivo = Boolean(url && chave);
export const supabase = supabaseAtivo
  ? createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null;

export const pareceJwt = (valor) => String(valor || '').split('.').length === 3;
