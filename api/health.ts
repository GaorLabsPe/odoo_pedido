import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders } from './_odoo_helper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeaders(corsHeaders);
  return res.status(200).json({ status: 'ok', message: 'OrderFlow API is running on Vercel' });
}
