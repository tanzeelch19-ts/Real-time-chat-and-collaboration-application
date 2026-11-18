import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/** Security headers for every response. The CSP is report-only: violations are logged, not blocked. */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    reportOnly: process.env.CSP_ENFORCE !== 'true',
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

/** Browsers can send many CSP reports. Limit them per IP so the log cannot be flooded. */
export const cspReportRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many reports.' } },
});

const clip = (value) => (typeof value === 'string' ? value.slice(0, 200) : undefined);

/** Keeps only the fields needed to find a violation: directive, blocked URL, and page URL. */
export function summarizeCspReport(item) {
  const r = item?.['csp-report'] ?? item?.body ?? item ?? {};
  return {
    violatedDirective: clip(r['violated-directive'] ?? r.effectiveDirective),
    blockedUri: clip(r['blocked-uri'] ?? r.blockedURL),
    documentUri: clip(r['document-uri'] ?? r.documentURL),
  };
}

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
