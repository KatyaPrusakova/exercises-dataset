import type { VercelRequest, VercelResponse } from '@vercel/node';
import workouts from '../../data/workouts.json';
import { BY_ID, getOrigin, withAbsoluteMedia } from '../../lib/data';

const BY_WORKOUT_ID = new Map(workouts.map(w => [w.id, w]));

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
