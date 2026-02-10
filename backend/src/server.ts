// Express server entry point

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import apiRoutes from './api/routes.js';
import { setupWebSocket } from './api/websocket.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://drone-delivery-frontend.onrender.com',
        /\.vercel\.app$/  // Allow any Vercel deployment
    ],
    credentials: true
}));
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup WebSocket
setupWebSocket(httpServer);

// Start server
const port = Number(PORT);
httpServer.listen(port, '0.0.0.0', () => {
    console.log(`🚁 Drone Delivery Backend running on port ${port}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔗 API: http://localhost:${port}/api`);
});
