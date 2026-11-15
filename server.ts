import 'dotenv/config';
import express from 'express';
import path from 'path';
import { z } from 'zod';
import { getCacheStats, getNasaTelemetry } from './server/nasaDataService';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Lightweight per-IP sliding window rate limiter
const rateWindowMs = 60_000;
const maxRequestsPerMin = 90;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimitMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || record.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + rateWindowMs });
    next();
    return;
  }
  if (record.count >= maxRequestsPerMin) {
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many requests, please wait a moment.',
    });
    return;
  }
  record.count++;
  next();
}

const telemetryQuerySchema = z.object({
  lat: z.coerce.number().min(21.5).max(32.5).default(31.1107),
  lon: z.coerce.number().min(24.5).max(37.0).default(30.9388),
  elevation: z.coerce.number().min(-150).max(2700).optional(),
  refresh: z.coerce.number().optional(),
});

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'agrishift',
      cache: getCacheStats(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/nasa/telemetry', rateLimitMiddleware, async (req, res) => {
    const parsed = telemetryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'Coordinates must be within Egypt bounds (lat 21.5–32.5, lon 24.5–37.0).',
      });
      return;
    }

    try {
      const telemetry = await getNasaTelemetry(
        parsed.data.lat,
        parsed.data.lon,
        parsed.data.elevation,
        parsed.data.refresh === 1
      );
      res.json(telemetry);
    } catch (err) {
      console.error('NASA telemetry route error:', err);
      res.status(502).json({
        error: 'TELEMETRY_FAILED',
        message: 'Unable to process satellite telemetry.',
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriShift server listening on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
