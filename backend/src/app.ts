import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.routes';
import classesRouter from './modules/classes/classes.routes';
import studentsRouter from './modules/students/students.routes';
import attendanceRouter from './modules/attendance/attendance.routes';
import examsRouter from './modules/exams/exams.routes';
import financeRouter from './modules/finance/finance.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import aiRouter from './modules/ai/ai.routes';
import practiceMaterialsRouter from './modules/practice-materials/practice-materials.routes';
import schoolsRouter from './modules/schools/schools.routes';

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  /\.campusflow\.app$/,
  // Allow localhost in development
  ...(env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

app.set('trust proxy', 1);

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI rate limit reached, please try again in an hour' },
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((pattern) =>
        typeof pattern === 'string' ? pattern === origin : pattern.test(origin),
      );
      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true,
  }),
);

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({
    name: 'CampusFlow API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/docs',
    openapi: '/api/openapi.json',
  });
});

// ── API Documentation ────────────────────────────────────────────────────────
// Served outside /api so it doesn't require X-School-Slug
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CampusFlow API Docs',
    customCss: `
      .swagger-ui .topbar { background: #18181b; }
      .swagger-ui .topbar .link { color: #60a5fa; }
      .swagger-ui .info .title { color: #f4f4f5; }
      body { background: #09090b; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

app.get('/api/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// ── Apply rate limiters before tenant middleware ───────────────────────────────
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register-school', authLimiter);
app.use('/api/ai', aiLimiter);

// All API routes require tenant resolution (except health)
app.use('/api', tenantMiddleware);
app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/exams', examsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/practice-materials', practiceMaterialsRouter);
app.use('/api/schools', schoolsRouter);

app.use(errorHandler);

export default app;
