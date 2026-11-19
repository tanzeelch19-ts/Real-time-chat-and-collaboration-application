// @vitest-environment node
import http from 'node:http';
import express from 'express';
import { describe, expect, it } from 'vitest';
import { cspReportRateLimit, summarizeCspReport } from './security.js';

describe('summarizeCspReport', () => {
  it('reads the classic csp-report format', () => {
    expect(
      summarizeCspReport({
        'csp-report': {
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.example/x.js',
          'document-uri': 'https://site.example/login',
          'source-file': 'should-not-appear',
        },
      }),
    ).toEqual({
      violatedDirective: 'script-src',
      blockedUri: 'https://evil.example/x.js',
      documentUri: 'https://site.example/login',
    });
  });

  it('reads the Reporting API format', () => {
    expect(
      summarizeCspReport({
        type: 'csp-violation',
        body: {
          effectiveDirective: 'img-src',
          blockedURL: 'data:image/x',
          documentURL: 'https://site.example/',
        },
      }),
    ).toEqual({
      violatedDirective: 'img-src',
      blockedUri: 'data:image/x',
      documentUri: 'https://site.example/',
    });
  });

  it('cuts long values to 200 characters', () => {
    const out = summarizeCspReport({ 'csp-report': { 'blocked-uri': 'a'.repeat(5000) } });
    expect(out.blockedUri).toHaveLength(200);
  });

  it('returns undefined for missing fields and never throws on odd input', () => {
    expect(summarizeCspReport({ 'csp-report': {} })).toEqual({
      violatedDirective: undefined,
      blockedUri: undefined,
      documentUri: undefined,
    });
    expect(() => summarizeCspReport(null)).not.toThrow();
    expect(() => summarizeCspReport('text')).not.toThrow();
  });
});

describe('cspReportRateLimit', () => {
  it('allows 20 reports a minute from one client and rejects the 21st', async () => {
    const app = express();
    app.use(express.json({ type: ['application/csp-report', 'application/json'] }));
    app.post('/r', cspReportRateLimit, (_req, res) => res.status(204).end());
    const server = http.createServer(app).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/r`;
    const statuses = [];
    for (let i = 0; i < 21; i += 1) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/csp-report' },
        body: '{"csp-report":{}}',
      });
      statuses.push(res.status);
    }
    server.close();
    expect(statuses.slice(0, 20).every((s) => s === 204)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
});
