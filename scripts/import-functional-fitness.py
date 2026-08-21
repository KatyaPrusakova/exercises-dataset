#!/usr/bin/env python3
"""
Import Functional Fitness Exercise Database CSV → data/exercises-functional.json.

Run once (or when the CSV updates) to produce a JSON file in the same shape
as data/exercises.en.json output, with extended classification fields.

Usage:
    python3 scripts/import-functional-fitness.py <path-to-csv>

The CSV expected at row 16 (1-indexed): the header row. Data starts at row 17.
"""
import csv
import json
import re
import sys
from pathlib import Path

# Columns in the CSV (0-indexed) — row 16 (1-indexed) is the header.
COL = {
    'name':                 1,
    'short_yt':             2,
    'deep_yt':              3,
    'difficulty':           4,
    'target':               5,
    'prime_mover':          6,
    'secondary_muscle':     7,
    'tertiary_muscle':      8,
    'primary_equipment':    9,
    'secondary_equipment':  11,
    'posture':              13,
    'grip':                 16,
    'movement_pattern_1':   21,
    'movement_pattern_2':   22,
    'movement_pattern_3':   23,
    'plane_of_motion_1':    24,
    'plane_of_motion_2':    25,
    'plane_of_motion_3':    26,
    'body_region':          27,
    'force_type':           28,
    'mechanics':            29,
    'laterality':           30,
    'classification':       31,
}

# Body Region → best-fit existing body_part enum value.
BODY_REGION_TO_PART = {
    'Core':        'waist',
    'Lower Body':  'upper legs',
    'Upper Body':  'chest',
    'Full Body':   'cardio',
}


def norm(s: str) -> str:
    """Strip whitespace and collapse internal doubles; return '' for None."""
    return re.sub(r'\s+', ' ', (s or '')).strip()


def clean_choice(s: str) -> str:
    """Normalize a classification/difficulty value: strip trailing '*' and whitespace."""
    s = norm(s)
    return s.rstrip('*').strip()


def transform(row: list[str], idx: int) -> dict:
    def get(key: str) -> str:
        i = COL[key]
        return norm(row[i]) if i < len(row) else ''

    name = get('name')
    body_region = clean_choice(get('body_region'))
    target = clean_choice(get('target')).lower()
    prime = clean_choice(get('prime_mover')).lower()
    secondary = [x for x in (clean_choice(get('secondary_muscle')).lower(),
                             clean_choice(get('tertiary_muscle')).lower()) if x]
    equipment = clean_choice(get('primary_equipment')).lower()
    movement_patterns = [p for p in (get('movement_pattern_1'),
                                     get('movement_pattern_2'),
                                     get('movement_pattern_3')) if p]
    planes = [p for p in (get('plane_of_motion_1'),
                          get('plane_of_motion_2'),
                          get('plane_of_motion_3')) if p]
    body_part = BODY_REGION_TO_PART.get(body_region, '')

    return {
        'id': f'ff-{idx:04d}',
        'name': name.lower(),
        'category': body_part,
        'body_part': body_part,
        'body_region': body_region,
        'equipment': equipment,
        'target': target,
        'muscle_group': prime,
        'secondary_muscles': secondary,
        'instructions': '',
        'instruction_steps': [],
        'media_id': '',
        'image': '',
        'gif_url': '',
        'attribution': '',
        'has_media': False,
        'classification':      clean_choice(get('classification')),
        'difficulty':          clean_choice(get('difficulty')),
        'mechanics':           clean_choice(get('mechanics')),
        'laterality':          clean_choice(get('laterality')),
        'force_type':          clean_choice(get('force_type')),
        'posture':             clean_choice(get('posture')),
        'grip':                clean_choice(get('grip')),
        'movement_patterns':   movement_patterns,
        'planes_of_motion':    planes,
    }


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        sys.exit(2)

    csv_path = Path(sys.argv[1])
    out_path = Path(__file__).resolve().parent.parent / 'data' / 'exercises-functional.json'

    records: list[dict] = []
    with csv_path.open('r', encoding='utf-8', newline='') as f:
        reader = csv.reader(f)
        for lineno, row in enumerate(reader, start=1):
            if lineno <= 16:                    # header + blank rows
                continue
            if not any(cell.strip() for cell in row):  # blank line
                continue
            name = norm(row[COL['name']]) if COL['name'] < len(row) else ''
            if not name:
                continue
            records.append(transform(row, len(records) + 1))

    out_path.write_text(json.dumps(records, ensure_ascii=False, indent=None), encoding='utf-8')

    # Stats
    from collections import Counter
    def top(field: str, n: int = 5) -> str:
        c = Counter(r[field] for r in records if r[field])
        return ', '.join(f'{k}={v}' for k, v in c.most_common(n))

    print(f'Wrote {len(records)} records to {out_path.relative_to(Path.cwd())}')
    print(f'  classifications: {top("classification")}')
    print(f'  difficulties:    {top("difficulty")}')
    print(f'  body_regions:    {top("body_region")}')
    print(f'  equipment (top): {top("equipment")}')


if __name__ == '__main__':
    main()
