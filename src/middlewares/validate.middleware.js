import { ZodError } from 'zod';

// Small wrapper around zod.parse to keep controllers clean.
// On success, puts the parsed data on req.validated.
export function validate(schema) {
  return (req, res, next) => {
    try {
      // Single source of truth for request parsing
      req.validated = schema.parse({ body: req.body, params: req.params, query: req.query });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Keep validation failures consistent and readable in clients
        return res.status(400).json({ error: 'ValidationError', details: err.flatten() });
      }
      next(err);
    }
  };
}
