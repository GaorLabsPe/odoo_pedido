import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../../odoo_connector.js';
import { getSupabase, getOdooConfig, corsHeaders } from '../_odoo_helper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).setHeaders(corsHeaders).end();
  res.setHeaders(corsHeaders);

  const cfg = await getOdooConfig();

  if (!cfg) {
    return res.status(200).json({
      products: 247, partners: 89, pending: 2, confirmed: 14, is_demo: true,
    });
  }

  try {
    const conn = await getConnection({ ...cfg, debug: false });
    const [products, partners] = await Promise.all([
      conn.searchCount('product.product', [['sale_ok', '=', true]]),
      conn.searchCount('res.partner', [['customer_rank', '>', 0]]),
    ]);

    const supabase = getSupabase();
    let pending = 0, confirmed = 0;
    if (supabase) {
      const [p, c] = await Promise.all([
        supabase.from('pedidos_queue').select('*', { count: 'exact', head: true }).eq('estado', 'pending'),
        supabase.from('pedidos_queue').select('*', { count: 'exact', head: true }).eq('estado', 'confirmed'),
      ]);
      pending = p.count || 0;
      confirmed = c.count || 0;
    }

    return res.status(200).json({ products, partners, pending, confirmed, is_demo: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
