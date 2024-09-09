const express = require('express')
const http = require('http')
const mongoose = require('mongoose')
require('dotenv').config()
const { initializeSocket } = require('../utils/socket')
const crawlerRoutes = require('./routes/crawlerRoutes')

const app = express()

// Create HTTP server and pass it to socket.io
const server = http.createServer(app)
// Initialize Socket.io
initializeSocket(server)


// Middleware
app.use(express.json())

// Routes
app.use('/api', crawlerRoutes)

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
    // useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=> console.log('MongoDB connected'))
.catch((err) => console.log(err))

// Use this to log mongo queries being executed!
mongoose.set('debug', true);

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// module.exports = app