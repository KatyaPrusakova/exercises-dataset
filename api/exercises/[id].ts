import type { VercelRequest, VercelResponse } from '@vercel/node';
import exercises from '../../data/exercises.en.json';

type Exercise = (typeof exercises)[number];

const byId = new Map<string, Exercise>((exercises as Exercise[]).map(ex => [ex.id, ex]));

export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '');
  const ex = byId.get(id);
  if (!ex) {
    res.status(404).json({ error: 'not_found', id });
    return;
  }
  const host = req.headers.host ?? 'localhost:3000';
  const origin = process.env.PUBLIC_BASE_URL ?? `https://${host}`;
  res.status(200).json({ ...ex, image: `${origin}/${ex.image}`, gif_url: `${origin}/${ex.gif_url}` });
}
