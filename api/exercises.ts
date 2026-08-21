import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EXERCISES, getOrigin, paginate, parseBool, parseLimit, parseOffset, queryParams, withAbsoluteMedia } from '../lib/data';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getOrigin(req);
  const params = queryParams(req);

  const limit = parseLimit(params.get('limit'));
  const offset = parseOffset(params.get('offset'));
  const bodyPart = params.get('bodyPart')?.toLowerCase() ?? params.get('body_part')?.toLowerCase();
  const bodyRegion = params.get('bodyRegion') ?? params.get('body_region');
  const equipment = params.get('equipment')?.toLowerCase();
  const target = params.get('target')?.toLowerCase();
  const classification = params.get('classification');
  const difficulty = params.get('difficulty');
  const mechanics = params.get('mechanics');
  const hasMedia = parseBool(params.get('has_media') ?? params.get('hasMedia'));
  const name = params.get('name')?.toLowerCase().trim() ?? params.get('q')?.toLowerCase().trim();

  let filtered = EXERCISES;
  if (bodyPart) filtered = filtered.filter(ex => ex.body_part === bodyPart);
  if (bodyRegion) filtered = filtered.filter(ex => ex.body_region.toLowerCase() === bodyRegion.toLowerCase());
  if (equipment) filtered = filtered.filter(ex => ex.equipment === equipment);
  if (target) filtered = filtered.filter(ex => ex.target === target);
  if (classification) filtered = filtered.filter(ex => ex.classification.toLowerCase() === classification.toLowerCase());
  if (difficulty) filtered = filtered.filter(ex => ex.difficulty.toLowerCase() === difficulty.toLowerCase());
  if (mechanics) filtered = filtered.filter(ex => ex.mechanics.toLowerCase() === mechanics.toLowerCase());
  if (hasMedia !== null) filtered = filtered.filter(ex => ex.has_media === hasMedia);
  if (name) filtered = filtered.filter(ex => ex.name.toLowerCase().includes(name));

  const page = paginate(filtered, limit, offset);
  res.status(200).json({ ...page, items: page.items.map(ex => withAbsoluteMedia(ex, origin)) });
}
