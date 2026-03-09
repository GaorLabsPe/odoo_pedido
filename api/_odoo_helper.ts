import { createClient } from '@supabase/supabase-js';

// ── Supabase ─────────────────────────────────────────────────────────────────
export function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Lee config de Odoo desde Supabase (tabla odoo_companies) ─────────────────
export async function getOdooConfigFromSupabase(companyId = 1) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('odoo_companies')
    .select('odoo_url, odoo_db, odoo_user, odoo_password, company_id')
    .eq('company_id', companyId)
    .eq('active', true)
    .single();

  if (error || !data) return null;

  return {
    url: data.odoo_url,
    db: data.odoo_db,
    username: data.odoo_user,
    password: data.odoo_password,
    companyId: data.company_id,
  };
}

// ── Odoo config: primero env vars, luego Supabase ────────────────────────────
export async function getOdooConfig(companyId = 1) {
  // Prioridad 1: variables de entorno (Vercel dashboard)
  if (process.env.ODOO_URL && process.env.ODOO_DB) {
    return {
      url: process.env.ODOO_URL,
      db: process.env.ODOO_DB,
      username: process.env.ODOO_USERNAME!,
      password: process.env.ODOO_PASSWORD!,
      companyId: parseInt(process.env.ODOO_COMPANY_ID || String(companyId)),
    };
  }
  // Prioridad 2: Supabase tabla odoo_companies
  return await getOdooConfigFromSupabase(companyId);
}

// ── CORS headers ─────────────────────────────────────────────────────────────
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
