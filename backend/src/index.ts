import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import routes
import authRoutes from './routes/auth.routes.js';
import crmRoutes from './routes/crm.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import productsRoutes from './routes/products.routes.js';
import marketingRoutes from './routes/marketing.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import usersRoutes from './routes/users.routes.js';
import blogsRoutes from './routes/blogs.routes.js';

// Import middleware
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

// Load environment variables (from repo root .env when running locally; Netlify injects env at runtime)
if (!process.env.NETLIFY) {
  const rootEnv = path.resolve(__dirname, '..', '..', '.env');
  dotenv.config({ path: rootEnv });
}
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Optional Redis: only connect when REDIS_ENABLED=true (e.g. in production).
// Without Redis, cache is skipped and the app still works.
const redisEnabled = process.env.REDIS_ENABLED === 'true';

const noOpCache = {
  get: async (_key: string): Promise<null> => null,
  setex: async (_key: string, _ttl: number, _value: string): Promise<void> => {},
  del: async (..._keys: string[]): Promise<void> => {},
  quit: async (): Promise<void> => {},
  get status() { return 'disabled' as const; },
};

function createRedisClient(): typeof noOpCache | Redis {
  if (!redisEnabled) {
    logger.info('Redis disabled (set REDIS_ENABLED=true to enable caching)');
    return noOpCache;
  }
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });
  client.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });
  return client;
}

export const redis = createRedisClient();

// Middleware
app.use(compression()); // Compress responses for faster transfer
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.match(/^http:\/\/localhost:\d+$/) || origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow local network IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/) || 
        origin.match(/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/) ||
        origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow configured APP_URL
    const allowedOrigins = [
      process.env.APP_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting: stricter for auth (brute-force protection), general for API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  message: { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    redis: redis.status === 'ready' ? 'connected' : redis.status === 'disabled' ? 'disabled' : 'disconnected'
  });
});

// Request logging middleware (only in development) - BEFORE routes to catch all requests
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Log all incoming requests including OPTIONS (CORS preflight)
    logger.info(`${req.method} ${req.path}`, {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']?.substring(0, 50),
      authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
      body: req.method === 'POST' || req.method === 'PUT' ? { ...req.body, password: req.body?.password ? '***' : undefined } : undefined,
    });
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/blogs', blogsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export app for Netlify Function; only start listening when running as a standalone server
export { app };

if (!process.env.NETLIFY) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 Access from other devices: http://192.168.1.39:${PORT}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await redis.quit();
    process.exit(0);
  });
}
