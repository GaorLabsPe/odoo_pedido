import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, corsHeaders } from '../_odoo_helper.js';
import { getConnection } from '../../odoo_connector.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).setHeaders(corsHeaders).end();
  res.setHeaders(corsHeaders);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, db, username, password, companyId } = req.body;

  if (!url || !db || !username || !password) {
    return res.status(400).json({ error: 'Faltan campos: url, db, username, password' });
  }

  const cleanUrl = url.trim().replace(/\/+$/, '');

  // 1. Verificar credenciales conectando a Odoo
  let uid: number;
  try {
    const conn = await getConnection({
      url: cleanUrl, db, username, password,
      companyId: companyId || 1,
      debug: false,
    });
    uid = conn.uid!;
  } catch (err: any) {
    return res.status(401).json({ error: 'No se pudo conectar a Odoo: ' + err.message });
  }

  // 2. Guardar en Supabase → tabla odoo_companies
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({
      error: 'Supabase no configurado. Agrega VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el dashboard de Vercel.',
    });
  }

  // Obtener nombre de la compañía desde Odoo
  let companyName = 'Mi Empresa';
  try {
    const conn = await getConnection({ url: cleanUrl, db, username, password, companyId: companyId || 1 });
    const companies = await conn.searchRead('res.company', [['id', '=', companyId || 1]], ['name']);
    if (companies?.length) companyName = companies[0].name;
  } catch (_) {}

  const { error } = await supabase
    .from('odoo_companies')
    .upsert({
      company_id: companyId || 1,
      name: companyName,
      odoo_url: cleanUrl,
      odoo_db: db,
      odoo_user: username,
      odoo_password: password,
      odoo_uid: uid,
      active: true,
      last_auth_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });

  if (error) {
    console.error('Supabase upsert error:', error);
    return res.status(500).json({ error: 'Error al guardar configuración: ' + error.message });
  }

  return res.status(200).json({
    status: 'ok',
    message: `Configuración guardada correctamente para ${companyName}`,
  });
}
