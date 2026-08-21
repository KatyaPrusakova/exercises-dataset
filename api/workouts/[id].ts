import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BY_ID, getOrigin, withAbsoluteMedia } from '../../lib/data';

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
const BY_WORKOUT_ID = new Map(WORKOUTS.map(w => [w.id, w]));

export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '').toLowerCase();
  const workout = BY_WORKOUT_ID.get(id);
  if (!workout) {
    res.status(404).json({ error: 'not_found', id });
    return;
  }
  const origin = getOrigin(req);
  const exercises = workout.exercise_ids
    .map(exId => BY_ID.get(exId))
    .filter((ex): ex is NonNullable<typeof ex> => ex !== undefined)
    .map(ex => withAbsoluteMedia(ex, origin));

  res.status(200).json({
    id: workout.id,
    name: workout.name,
    body_part: workout.body_part,
    work_seconds: workout.work_seconds,
    rest_seconds: workout.rest_seconds,
    exercise_count: exercises.length,
    total_seconds: exercises.length * (workout.work_seconds + workout.rest_seconds),
    exercises,
  });
}
