// server/src/app.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const cors = require('cors');

// Import routes with error handling
let crawlerRoutes, exportRoutes, oauth2Routes;
try {
    crawlerRoutes = require('./routes/crawlerRoutes');
    console.log('✅ Crawler routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading crawler routes:', error.message);
    crawlerRoutes = express.Router();
}

try {
    exportRoutes = require('./routes/exportRoutes');
    console.log('✅ Export routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading export routes:', error.message);
    exportRoutes = express.Router();
}

try {
    oauth2Routes = require('./routes/oauth2Routes');
    console.log('✅ OAuth2 routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading OAuth2 routes:', error.message);
    oauth2Routes = express.Router();
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

/* ———————————————————
   1) CORS (dev only)
   ——————————————————— */
if (!isProd) {
    app.use(
        cors({
            origin: process.env.ORIGIN || 'http://localhost:5173', // Vue dev server
        })
    );
}

/* ———————————————————
   2) Body-parser
   ——————————————————— */
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

/* ———————————————————
   3) API routes
   ——————————————————— */
app.use('/api', crawlerRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/oauth2', oauth2Routes);

// Add a test route to verify the server is working
app.get('/test', (req, res) => {
    console.log('🔍 Test route hit');
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

console.log('🚀 Routes registered:');
console.log('   - /api/* (crawler routes)');
console.log('   - /api/export/* (export routes)');
console.log('   - /api/oauth2/* (OAuth2 routes)');
console.log('   - /test (test route)');

/* ———————————————————
   4) Serve Vue build (prod only)
   ——————————————————— */
if (isProd) {
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));

    // SPA fallback
    app.get('*', (_req, res) =>
        res.sendFile(path.join(clientDistPath, 'index.html'))
    );
}

/* ———————————————————
   5) MongoDB
   ——————————————————— */
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db')
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

if (!isProd) mongoose.set('debug', true); // query logging in dev

/* ———————————————————
   6) Start server
   ——————————————————— */
const PORT = process.env.PORT || (isProd ? 3000 : 3001);
app.listen(PORT, () => {
    console.log('🎉 Server started successfully!');
    console.log(`🌐 Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
    console.log(`📡 Test URL: http://localhost:${PORT}/test`);
    console.log(`📡 Export test URL: http://localhost:${PORT}/api/export/test`);
});

module.exports = app;
