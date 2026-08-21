import type { VercelRequest, VercelResponse } from '@vercel/node';
import facets from '../data/facets.en.json';

type FacetKey = keyof typeof facets;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const type = req.query.type;
  if (typeof type === 'string' && type in facets) {
    res.status(200).json(facets[type as FacetKey]);
    return;
  }
  res.status(200).json(facets);
}
