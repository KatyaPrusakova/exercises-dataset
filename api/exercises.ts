import type { VercelRequest, VercelResponse } from '@vercel/node';
import exercises from '../data/exercises.en.json';

type Exercise = (typeof exercises)[number];

function withAbsoluteMedia(ex: Exercise, origin: string): Exercise {
  return { ...ex, image: `${origin}/${ex.image}`, gif_url: `${origin}/${ex.gif_url}` };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers.host ?? 'localhost:3000';
  const origin = process.env.PUBLIC_BASE_URL ?? `https://${host}`;
  const params = new URL(req.url ?? '/', `https://${host}`).searchParams;

  const limit = Math.min(Math.max(parseInt(params.get('limit') ?? '50', 10) || 50, 1), 200);
  const offset = Math.max(parseInt(params.get('offset') ?? '0', 10) || 0, 0);
  const category = params.get('category')?.toLowerCase();
  const bodyPart = params.get('body_part')?.toLowerCase();
  const equipment = params.get('equipment')?.toLowerCase();
  const target = params.get('target')?.toLowerCase();
  const q = params.get('q')?.toLowerCase().trim();

  let filtered = exercises as Exercise[];
  if (category) filtered = filtered.filter(ex => ex.category === category);
  if (bodyPart) filtered = filtered.filter(ex => ex.body_part === bodyPart);
  if (equipment) filtered = filtered.filter(ex => ex.equipment === equipment);
  if (target) filtered = filtered.filter(ex => ex.target === target);
  if (q) {
    filtered = filtered.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.target.toLowerCase().includes(q) ||
      ex.muscle_group.toLowerCase().includes(q)
    );
  }

  const items = filtered.slice(offset, offset + limit).map(ex => withAbsoluteMedia(ex, origin));

  res.status(200).json({
    total: filtered.length,
    limit,
    offset,
    count: items.length,
    items,
  });
}
