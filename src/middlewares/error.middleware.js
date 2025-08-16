export function notFoundHandler(req, res, next) {
  // Anything not matched by routes lands here
  res.status(404).json({ error: 'NotFound', message: 'Route not found' });
}

export function errorHandler(err, req, res, next) { 
  // Centralized error serializer — keeps responses consistent
  console.error(err);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({ error: err.name || 'InternalServerError', message: err.message || 'Unexpected error' });
}
