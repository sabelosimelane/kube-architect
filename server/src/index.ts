import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

import projectsRouter from './routes/projects';

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/projects', projectsRouter);

// Database check endpoint
app.get('/api/db-status', (req, res) => {
    try {
        const result = db.prepare('SELECT 1').get();
        res.json({ status: 'connected', result });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Export app for testing
export { app };

// Start server if run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Database connected: ${process.env.DATABASE_URL || './dev.sqlite'}`);
    });
}
