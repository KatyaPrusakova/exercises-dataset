import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Workout {
  id: string;
  name: string;
  body_part: string;
  work_seconds: number;
  rest_seconds: number;
  exercise_ids: string[];
}

const WORKOUTS: Workout[] = JSON.parse(
  readFileSync(join(process.cwd(), 'data/workouts.json'), 'utf8')
);

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const summaries = WORKOUTS.map(w => ({
    id: w.id,
    name: w.name,
    body_part: w.body_part,
    work_seconds: w.work_seconds,
    rest_seconds: w.rest_seconds,
    exercise_count: w.exercise_ids.length,
    total_seconds: w.exercise_ids.length * (w.work_seconds + w.rest_seconds),
  }));
  res.status(200).json({ count: summaries.length, workouts: summaries });
}
