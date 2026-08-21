const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const FACETS = JSON.parse(readFileSync(join(process.cwd(), 'data/facets.en.json'), 'utf8'));

module.exports = (req, res) => {
  const type = req.query.type;
  if (typeof type === 'string' && type in FACETS) {
    res.status(200).json(FACETS[type]);
    return;
  }
  res.status(200).json(FACETS);
};
