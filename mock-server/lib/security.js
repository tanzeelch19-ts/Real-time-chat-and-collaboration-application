import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/** Security headers for every response. The CSP is report-only: violations are logged, not blocked. */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    reportOnly: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      reportUri: ['/api/csp-report'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/** Limits login, registration, and password-reset attempts to slow down guessing and email spam. */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a few minutes and try again.' },
  },
});

/** Writes one line per request: method, path, status, and duration. Never logs bodies or headers. */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path === '/api/health') return;
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
      }),
    );
  });
  next();
}
