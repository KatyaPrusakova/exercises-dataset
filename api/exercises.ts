import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EXERCISES, getOrigin, paginate, parseLimit, parseOffset, queryParams, withAbsoluteMedia } from '../lib/data';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getOrigin(req);
  const params = queryParams(req);

  const limit = parseLimit(params.get('limit'));
  const offset = parseOffset(params.get('offset'));
  const bodyPart = params.get('bodyPart')?.toLowerCase() ?? params.get('body_part')?.toLowerCase();
  const equipment = params.get('equipment')?.toLowerCase();
  const target = params.get('target')?.toLowerCase();
  const name = params.get('name')?.toLowerCase().trim() ?? params.get('q')?.toLowerCase().trim();

  let filtered = EXERCISES;
  if (bodyPart) filtered = filtered.filter(ex => ex.body_part === bodyPart);
  if (equipment) filtered = filtered.filter(ex => ex.equipment === equipment);
  if (target) filtered = filtered.filter(ex => ex.target === target);
  if (name) filtered = filtered.filter(ex => ex.name.toLowerCase().includes(name));

  const page = paginate(filtered, limit, offset);
  res.status(200).json({ ...page, items: page.items.map(ex => withAbsoluteMedia(ex, origin)) });
}
