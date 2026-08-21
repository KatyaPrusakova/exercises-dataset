#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(readFileSync(join(root, 'data', 'exercises.json'), 'utf8'));

const slim = source.map(ex => ({
  id: ex.id,
  name: ex.name,
  category: ex.category,
  body_part: ex.body_part,
  equipment: ex.equipment,
  target: ex.target,
  muscle_group: ex.muscle_group,
  secondary_muscles: ex.secondary_muscles,
  instructions: ex.instructions.en,
  instruction_steps: ex.instruction_steps.en,
  media_id: ex.media_id,
  image: ex.image,
  gif_url: ex.gif_url,
  attribution: ex.attribution,
}));

writeFileSync(join(root, 'data', 'exercises.en.json'), JSON.stringify(slim));

const unique = key => [...new Set(source.map(ex => ex[key]))].sort();
const facets = {
  categories: unique('category'),
  body_parts: unique('body_part'),
  equipment: unique('equipment'),
  targets: unique('target'),
  muscle_groups: unique('muscle_group'),
};

writeFileSync(join(root, 'data', 'facets.en.json'), JSON.stringify(facets));

const slimMB = (JSON.stringify(slim).length / 1024 / 1024).toFixed(2);
console.log(`Built ${slim.length} exercises → data/exercises.en.json (${slimMB} MB)`);
console.log(`Facets → data/facets.en.json: ${Object.entries(facets).map(([k, v]) => `${k}=${v.length}`).join(', ')}`);
