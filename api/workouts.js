const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const WORKOUTS = JSON.parse(readFileSync(join(process.cwd(), 'data/workouts.json'), 'utf8'));

module.exports = (_req, res) => {
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
};
