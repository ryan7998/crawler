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
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=> console.log('MongoDB connected'))
.catch((err) => console.log(err))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// module.exports = app