const { BY_ID, getOrigin, withAbsoluteMedia } = require('../../lib/data');

module.exports = (req, res) => {
  const id = String(req.query.id || '');
  const ex = BY_ID.get(id);
  if (!ex) {
    res.status(404).json({ error: 'not_found', id });
    return;
  }
  res.status(200).json(withAbsoluteMedia(ex, getOrigin(req)));
};
