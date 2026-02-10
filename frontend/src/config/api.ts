// API Configuration

export const API_CONFIG = {
    // Use environment variable in production, localhost in development
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
};
