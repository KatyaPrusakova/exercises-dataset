import type { VercelRequest, VercelResponse } from '@vercel/node';
import facets from '../../data/facets.en.json';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json(facets.equipment);
}
