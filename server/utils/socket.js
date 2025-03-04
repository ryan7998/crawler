const { Server } = require('socket.io')

let io  // To store the Socket.io instance

// Initialize Socket.io and export it
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_ORIGIN || 'http://localhost:5173', // Allow your frontend origin
            methods: ["GET", "POST"],
            credentials: true,
        }
    })

    io.on('connection', (socket) => {
        console.log('New client connected')

        // Join the room for a specific crawl ID
        socket.on('joinCrawl', (crawlId) => {
            socket.join(crawlId) // Join room for the crawl by crawlId
            console.log(`Client joined crawl: ${crawlId}`)
        })

        // Handle any custom events we want, like 'pauseCrawl', 'resumeCrawl'
        socket.on('pauseCrawl', () => {
            console.log('Crawl paused by client')
        })

        socket.on('resumeCrawl', () => {
            console.log('Crawl resumed by client')
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected')
        })
    })
    return io
}

// Get the initialized Socket.io instance
const getSocket = () => {
    if(!io) {
        throw new Error("Socket.io not initialized. Please call initializeSocket first.")
    }
    return io
}

module.exports = { initializeSocket, getSocket }