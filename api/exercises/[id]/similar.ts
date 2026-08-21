import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BY_ID, EXERCISES, getOrigin, paginate, parseLimit, parseOffset, queryParams, withAbsoluteMedia, type Exercise } from '../../../lib/data';

function score(a: Exercise, b: Exercise): number {
  let s = 0;
  if (a.target === b.target) s += 4;
  if (a.body_part === b.body_part) s += 2;
  if (a.equipment === b.equipment) s += 1;
  if (a.muscle_group === b.muscle_group) s += 1;
  const aSec = new Set(a.secondary_muscles ?? []);
  for (const m of b.secondary_muscles ?? []) if (aSec.has(m)) s += 1;
  return s;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '');
  const source = BY_ID.get(id);
  if (!source) {
    res.status(404).json({ error: 'not_found', id });
    return;
  }
  const params = queryParams(req);
  const ranked = EXERCISES
    .filter(ex => ex.id !== id)
    .map(ex => ({ ex, s: score(source, ex) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.ex);

  const page = paginate(ranked, parseLimit(params.get('limit'), 20), parseOffset(params.get('offset')));
  const origin = getOrigin(req);
  res.status(200).json({ ...page, items: page.items.map(ex => withAbsoluteMedia(ex, origin)) });
}
