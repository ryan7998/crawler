// server/src/app.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const cors = require('cors');
const crawlerRoutes = require('./routes/crawlerRoutes');

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

/* ———————————————————
   3) API routes
   ——————————————————— */
app.use('/api', crawlerRoutes);

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
app.listen(PORT, () =>
    console.log(
        `Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`
    )
);

module.exports = app;
