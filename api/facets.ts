import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cwd = process.cwd();
    const debug: Record<string, unknown> = {
      cwd,
      __dirname,
      cwd_entries: readdirSync(cwd).slice(0, 30),
    };
    const dataDir = join(cwd, 'data');
    debug.data_dir_exists = existsSync(dataDir);
    if (debug.data_dir_exists) {
      debug.data_entries = readdirSync(dataDir);
    }
    const facetsPath = join(cwd, 'data', 'facets.en.json');
    debug.facets_exists = existsSync(facetsPath);

    if (req.query.debug) {
      res.status(200).json({ ok: true, debug });
      return;
    }

    if (!debug.facets_exists) {
      res.status(500).json({ error: 'data_file_missing', debug });
      return;
    }

    const facets = JSON.parse(readFileSync(facetsPath, 'utf8'));
    const type = req.query.type;
    if (typeof type === 'string' && type in facets) {
      res.status(200).json(facets[type]);
      return;
    }
    res.status(200).json(facets);
  } catch (err) {
    res.status(500).json({
      error: 'handler_crash',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 6) : null,
    });
  }
}
