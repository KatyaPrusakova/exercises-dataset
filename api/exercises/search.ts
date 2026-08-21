import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EXERCISES, getOrigin, paginate, parseLimit, parseOffset, queryParams, withAbsoluteMedia } from '../../lib/data';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const params = queryParams(req);
  const bodyPart = params.get('bodyPart')?.toLowerCase();
  const target = params.get('target')?.toLowerCase();
  const equipment = params.get('equipment')?.toLowerCase();
  const name = params.get('name')?.toLowerCase().trim();

  let filtered = EXERCISES;
  if (bodyPart) filtered = filtered.filter(ex => ex.body_part === bodyPart);
  if (target) filtered = filtered.filter(ex => ex.target === target);
  if (equipment) filtered = filtered.filter(ex => ex.equipment === equipment);
  if (name) filtered = filtered.filter(ex => ex.name.toLowerCase().includes(name));

  const page = paginate(filtered, parseLimit(params.get('limit')), parseOffset(params.get('offset')));
  const origin = getOrigin(req);
  res.status(200).json({ ...page, items: page.items.map(ex => withAbsoluteMedia(ex, origin)) });
}
