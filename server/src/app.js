// server/src/app.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const crawlerRoutes = require('./routes/crawlerRoutes');
// (If you’re still using Socket.io on a separate port, leave that setup in your worker or another file.)

const app = express();

// ——————————————————————————
// 1) (Optional) Adjust CORS
// ——————————————————————————
// Since the Vue app will now be served from the same origin as your API,
// you can remove the strict CORS origin rule. If you still need to allow
// some other domains (e.g. for development), you can keep it, but for a
// production “build” you typically don’t need to allow localhost:5173 any more.
//
// Uncomment or modify below only if you still want to allow some remote origins:
//
// const cors = require('cors');
// app.use(
//   cors({
//     origin: process.env.ORIGIN || 'http://localhost:5173',
//   })
// );

// If you don’t need cross-origin requests anymore, you can simply omit CORS
// entirely, or only enable it on specific /api routes if required.

// ——————————————————————————
// 2) JSON Body Parser
// ——————————————————————————
app.use(express.json());

// ——————————————————————————
// 3) Mount your API routes under /api
// ——————————————————————————
app.use('/api', crawlerRoutes);

// ——————————————————————————
// 4) Serve the built Vue frontend
// ——————————————————————————
// __dirname is now “server/src” (because this file lives there).
// We want to point at “client/dist” which is two levels up: server/src → server → (project root) → client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');

// Any request for a static file (JS, CSS, images) will be served from client/dist
app.use(express.static(clientDistPath));

// ——————————————————————————
// 5) Catch-all: return index.html for any non-API route
// ——————————————————————————
// This ensures that routes defined in Vue Router (e.g. /dashboard/123) all
// return index.html, and Vue’s client-side router can take over.
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ——————————————————————————
// 6) Connect to MongoDB
// ——————————————————————————
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
        // In Mongoose v6, useNewUrlParser/useUnifiedTopology are defaults
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

// (Optional) Enable query logging in dev:
// mongoose.set('debug', true);

// ——————————————————————————
// 7) Start Express
// ——————————————————————————
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server (API + static files) is running on port ${PORT}`);
});
