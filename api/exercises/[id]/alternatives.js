const { BY_ID, EXERCISES, getOrigin, paginate, parseLimit, parseOffset, queryParams, withAbsoluteMedia } = require('../../../lib/data');

module.exports = (req, res) => {
  const id = String(req.query.id || '');
  const source = BY_ID.get(id);
  if (!source) {
    res.status(404).json({ error: 'not_found', id });
    return;
  }
  const params = queryParams(req);
  const onlyEquipment = params.get('equipment') && params.get('equipment').toLowerCase();
  const excludeEquipment = new Set(((params.get('excludeEquipment') || '').toLowerCase()).split(',').filter(Boolean));
  excludeEquipment.add(source.equipment);

  let filtered = EXERCISES.filter(ex => ex.id !== id && ex.target === source.target && !excludeEquipment.has(ex.equipment));
  if (onlyEquipment) filtered = filtered.filter(ex => ex.equipment === onlyEquipment);

  const page = paginate(filtered, parseLimit(params.get('limit'), 20), parseOffset(params.get('offset')));
  const origin = getOrigin(req);
  res.status(200).json({ ...page, items: page.items.map(ex => withAbsoluteMedia(ex, origin)) });
};
