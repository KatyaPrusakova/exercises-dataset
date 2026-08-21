import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BY_ID, getOrigin, withAbsoluteMedia } from '../../../lib/data';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '');
  const ex = BY_ID.get(id);
  if (!ex) {
    res.status(404).json({ error: 'not_found', id });
    return;
  }
  res.status(200).json(withAbsoluteMedia(ex, getOrigin(req)));
}
