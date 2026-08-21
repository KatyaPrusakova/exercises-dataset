import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cwd = process.cwd();
    const debug: Record<string, unknown> = { cwd, __dirname };
    debug.cwd_entries = existsSync(cwd) ? readdirSync(cwd).slice(0, 30) : 'cwd missing';
    const dataDir = join(cwd, 'data');
    debug.data_dir_exists = existsSync(dataDir);
    if (debug.data_dir_exists) debug.data_entries = readdirSync(dataDir);
    const facetsPath = join(cwd, 'data', 'facets.en.json');
    debug.facets_exists = existsSync(facetsPath);
    if (debug.facets_exists && !req.query.debug) {
      const facets = JSON.parse(readFileSync(facetsPath, 'utf8'));
      const type = req.query.type;
      if (typeof type === 'string' && type in facets) {
        res.status(200).json(facets[type]);
        return;
      }
      res.status(200).json(facets);
      return;
    }
    res.status(200).json({ debug });
  } catch (err) {
    res.status(500).json({
      error: 'crash',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 8) : null,
    });
  }
}
