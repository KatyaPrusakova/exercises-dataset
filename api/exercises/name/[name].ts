import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EXERCISES, getOrigin, paginate, parseLimit, parseOffset, pathParam, queryParams, withAbsoluteMedia } from '../../../lib/data';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const q = pathParam(req, 'name');
  const params = queryParams(req);
  const filtered = q ? EXERCISES.filter(ex => ex.name.toLowerCase().includes(q)) : [];
  const page = paginate(filtered, parseLimit(params.get('limit')), parseOffset(params.get('offset')));
  const origin = getOrigin(req);
  res.status(200).json({ ...page, items: page.items.map(ex => withAbsoluteMedia(ex, origin)) });
}
