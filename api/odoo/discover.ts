import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../../odoo_connector.js';
import { corsHeaders } from '../_odoo_helper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  res.setHeaders(corsHeaders);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, db, username, password } = req.body;

  if (!url || !db || !username || !password) {
    return res.status(400).json({ error: 'Faltan campos: url, db, username, password' });
  }

  try {
    const conn = await getConnection({
      url: url.trim().replace(/\/+$/, ''),
      db,
      username,
      password,
      companyId: 1,
      debug: false,
    });

    const companies = await conn.searchRead('res.company', [], ['name', 'id']);
    return res.status(200).json({ status: 'ok', companies });
  } catch (err: any) {
    return res.status(401).json({ error: 'Error de autenticación: ' + err.message });
  }
}
