import type { VercelRequest } from '@vercel/node';
import exercises from '../data/exercises.en.json';

export type Exercise = (typeof exercises)[number];

export const EXERCISES: Exercise[] = exercises as Exercise[];
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
