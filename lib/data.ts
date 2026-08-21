import type { VercelRequest } from '@vercel/node';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  target: string;
  muscle_group: string;
  secondary_muscles: string[];
  instructions: string;
  instruction_steps: string[];
  media_id: string;
  image: string;
  gif_url: string;
  attribution: string;
}

function loadJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), relPath), 'utf8')) as T;
}

export const EXERCISES: Exercise[] = loadJson<Exercise[]>('data/exercises.en.json');
export const BY_ID: Map<string, Exercise> = new Map(EXERCISES.map(ex => [ex.id, ex]));

export function getOrigin(req: VercelRequest): string {
  const host = req.headers.host ?? 'localhost:3000';
  return process.env.PUBLIC_BASE_URL ?? `https://${host}`;
}

export function withAbsoluteMedia(ex: Exercise, origin: string): Exercise {
  return { ...ex, image: `${origin}/${ex.image}`, gif_url: `${origin}/${ex.gif_url}` };
}

export function paginate<T>(items: T[], limit: number, offset: number) {
  return {
    total: items.length,
    limit,
    offset,
    count: Math.min(limit, Math.max(items.length - offset, 0)),
    items: items.slice(offset, offset + limit),
  };
}

export function parseLimit(v: string | null | undefined, def = 50, max = 200): number {
  const n = parseInt(v ?? '', 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : def, 1), max);
}

export function parseOffset(v: string | null | undefined): number {
  const n = parseInt(v ?? '', 10);
  return Math.max(Number.isFinite(n) ? n : 0, 0);
}

export function queryParams(req: VercelRequest): URLSearchParams {
  const host = req.headers.host ?? 'localhost:3000';
  return new URL(req.url ?? '/', `https://${host}`).searchParams;
}

export function pathParam(req: VercelRequest, key: string): string {
  const raw = req.query[key];
  const val = Array.isArray(raw) ? raw[0] : raw;
  return decodeURIComponent(String(val ?? '')).toLowerCase().trim();
}
