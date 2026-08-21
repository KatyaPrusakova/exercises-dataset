import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Facets {
  categories: string[];
  body_parts: string[];
  equipment: string[];
  targets: string[];
  muscle_groups: string[];
  [key: string]: string[];
}

const FACETS: Facets = JSON.parse(
  readFileSync(join(process.cwd(), 'data/facets.en.json'), 'utf8')
);

export default function handler(req: VercelRequest, res: VercelResponse) {
  const type = req.query.type;
  if (typeof type === 'string' && type in FACETS) {
    res.status(200).json(FACETS[type]);
    return;
  }
  res.status(200).json(FACETS);
}
