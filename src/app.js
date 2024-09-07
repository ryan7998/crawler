const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
const crawlerRoutes = require('./routes/crawlerRoutes')

// Middleware
app.use(express.json())

// Routes
app.use('/api', crawlerRoutes)

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
    useFindAndModify: false,
    useNewUrlParser: true,
    connectTimeoutMS: 30000,  // 30 seconds connection timeout
    serverSelectionTimeoutMS: 30000  // 30 seconds server selection timeout
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