/**
 * server.js - Pure API Entry Point
 * 
 * In this production-grade architecture, the backend serves ONLY the API.
 * The frontend is deployed separately (e.g., on Vercel) and communicates
 * with this server via CORS.
 */
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration - Allow all origins for the separate frontend deployment
app.use(cors({
    origin: '*'
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vitals', require('./routes/vitals'));

// Root Health Check Route
app.get('/', (req, res) => {
    res.send('🏥 MedRemind API is running in production mode...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
