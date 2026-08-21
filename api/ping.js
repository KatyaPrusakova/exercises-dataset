module.exports = (_req, res) => {
  res.status(200).json({
    ok: true,
    node: process.version,
    cwd: process.cwd(),
    env_node: process.env.AWS_LAMBDA_JS_RUNTIME || process.env.NODE_ENV || null,
  });
};
