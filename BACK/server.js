// =============================================
// SMARTFARM CREDIT - BACKEND SERVER
// =============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from './database/db.js';
import authRoutes from './routes/auth.js';
import loanRoutes from './routes/loans.js';
import marketplaceRoutes from './routes/marketplace.js';
import userRoutes from './routes/users.js';
import helmet from 'helmet';
import logger from './logger.js';
import setupSwagger from './swagger.js';



// Initialize environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({

    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../FRONT')));

// Initialize Database
const db = new Database();
await db.initialize();

// Make database available to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/users', userRoutes);
setupSwagger(app);


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        status: err.status || 500
    });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`✓ SmartFarm Credit Server running on port ${PORT}`);
    logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`✓ API available at http://localhost:${PORT}/api`);
});


export default app;
