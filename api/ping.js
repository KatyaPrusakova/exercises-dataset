module.exports = (_req, res) => {
  res.status(200).json({ ok: true, from: 'pure JS handler', node: process.version });
};
