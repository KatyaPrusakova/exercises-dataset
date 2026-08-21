module.exports = (req, res) => {
  res.status(200).json({ ok: true, from: 'pure JS handler' });
};
