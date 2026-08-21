import type { VercelRequest, VercelResponse } from '@vercel/node';
import workouts from '../data/workouts.json';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const summaries = workouts.map(w => ({
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
