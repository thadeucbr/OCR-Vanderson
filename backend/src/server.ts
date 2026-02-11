import express, { Request, Response } from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import analysisRoutes from './routes/analysisRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Validate environment
validateEnv();

// Routes
app.use('/api', analysisRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(env.PORT, () => {
      console.log(`✓ Server running on port ${env.PORT}`);
      console.log(`  API: http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
