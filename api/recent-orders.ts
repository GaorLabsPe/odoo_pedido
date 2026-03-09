import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, corsHeaders } from './_odoo_helper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).setHeaders(corsHeaders).end();
  res.setHeaders(corsHeaders);

  const supabase = getSupabase();
  if (!supabase) return res.status(200).json([]);

  const { data } = await supabase
    .from('pedidos_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return res.status(200).json(data || []);
}
