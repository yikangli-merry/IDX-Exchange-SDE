function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`
    );
  });

  next();
}

module.exports = requestLogger;
