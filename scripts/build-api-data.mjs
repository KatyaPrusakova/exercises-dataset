#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(readFileSync(join(root, 'data', 'exercises.json'), 'utf8'));

// ── Heuristics for auto-deriving classification/difficulty on the original
//    media-rich dataset (no source values). Best-effort — coarse but useful
//    for filter UIs. Order matters: first match wins.
const CLASSIFICATION_RULES = [
  { match: ex => /^(barbell|band|smith) (deadlift|full squat|bench press|clean|snatch|jerk|thruster)/i.test(ex.name), value: 'Powerlifting' },
  { match: ex => /^(barbell|dumbbell|kettlebell) (clean|snatch|jerk|thruster|overhead squat|hang clean)/i.test(ex.name), value: 'Olympic Weightlifting' },
  { match: ex => ex.body_part === 'cardio' && /(jump|burpee|high knee|hop|skip|bound)/i.test(ex.name), value: 'Plyometric' },
  { match: ex => ex.equipment === 'body weight' && /(muscle up|handstand|pistol|planche|lever|human flag|dip|pull-up|push-up|ring)/i.test(ex.name), value: 'Calisthenics' },
  { match: ex => /stretch$/i.test(ex.name) || /^(neck|shoulder|hip|hamstring|quad|back) (stretch|mobility)/i.test(ex.name), value: 'Mobility' },
  { match: ex => ex.body_part === 'waist' && /(plank|hollow|dead bug|bird dog|bridge)/i.test(ex.name), value: 'Postural' },
  { match: ex => /(kettlebell)/i.test(ex.equipment) && /(swing|snatch|clean|jerk|windmill|get up)/i.test(ex.name), value: 'Ballistics' },
  { match: ex => ['barbell', 'dumbbell', 'cable', 'leverage machine', 'smith machine', 'ez barbell'].includes(ex.equipment), value: 'Bodybuilding' },
  { match: ex => ex.equipment === 'body weight', value: 'Calisthenics' },
];

const DIFFICULTY_RULES = [
  { match: ex => /(assisted|beginner|basic|introduction)/i.test(ex.name), value: 'Beginner' },
  { match: ex => /(one arm|single leg|pistol|muscle up|handstand|planche|human flag|weighted pull|weighted dip|deficit)/i.test(ex.name), value: 'Advanced' },
  { match: ex => ex.equipment === 'body weight' && /(push-up|sit-up|squat|lunge|plank)/i.test(ex.name), value: 'Beginner' },
  { match: () => true, value: 'Intermediate' },
];

const BODY_PART_TO_REGION = {
  'back': 'Upper Body', 'chest': 'Upper Body', 'shoulders': 'Upper Body',
  'upper arms': 'Upper Body', 'lower arms': 'Upper Body', 'neck': 'Upper Body',
  'upper legs': 'Lower Body', 'lower legs': 'Lower Body',
  'waist': 'Core',
  'cardio': 'Full Body',
};

function classify(ex) {
  for (const rule of CLASSIFICATION_RULES) if (rule.match(ex)) return rule.value;
  return '';
}
function difficultyFor(ex) {
  for (const rule of DIFFICULTY_RULES) if (rule.match(ex)) return rule.value;
  return '';
}
function mechanicsFor(ex) {
  const singleJoint = /(curl|extension|raise|fly|kickback|shrug|calf raise)/i.test(ex.name);
  return singleJoint ? 'Isolation' : 'Compound';
}

const slimOriginal = source.map(ex => ({
  id: ex.id,
  name: ex.name,
  category: ex.category,
  body_part: ex.body_part,
  body_region: BODY_PART_TO_REGION[ex.body_part] ?? '',
  equipment: ex.equipment,
  target: ex.target,
  muscle_group: ex.muscle_group,
  secondary_muscles: ex.secondary_muscles ?? [],
  instructions: ex.instructions.en,
  instruction_steps: ex.instruction_steps.en,
  media_id: ex.media_id,
  image: ex.image,
  gif_url: ex.gif_url,
  attribution: ex.attribution,
  has_media: true,
  classification: classify(ex),
  difficulty: difficultyFor(ex),
  mechanics: mechanicsFor(ex),
  laterality: '',
  force_type: '',
  posture: '',
  grip: '',
  movement_patterns: [],
  planes_of_motion: [],
}));

// Merge the functional-fitness dataset (already in the extended shape).
const functionalPath = join(root, 'data', 'exercises-functional.json');
const functional = existsSync(functionalPath) ? JSON.parse(readFileSync(functionalPath, 'utf8')) : [];

const combined = [...slimOriginal, ...functional];
writeFileSync(join(root, 'data', 'exercises.en.json'), JSON.stringify(combined));

// ── Facets: unique values across the combined set, dropping empty strings.
const unique = key => [...new Set(combined.map(ex => ex[key]).filter(Boolean))].sort();
const facets = {
  categories:      unique('category'),
  body_parts:      unique('body_part'),
  body_regions:    unique('body_region'),
  equipment:       unique('equipment'),
  targets:         unique('target'),
  muscle_groups:   unique('muscle_group'),
  classifications: unique('classification'),
  difficulties:    unique('difficulty'),
  mechanics:       unique('mechanics'),
};
writeFileSync(join(root, 'data', 'facets.en.json'), JSON.stringify(facets));

const slimMB = (JSON.stringify(combined).length / 1024 / 1024).toFixed(2);
console.log(`Built ${combined.length} exercises (${slimOriginal.length} original + ${functional.length} functional) → data/exercises.en.json (${slimMB} MB)`);
console.log(`Facets → data/facets.en.json: ${Object.entries(facets).map(([k, v]) => `${k}=${v.length}`).join(', ')}`);
