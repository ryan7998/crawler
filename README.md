# Web Crawler Application

A full-stack web application for crawling websites and extracting data using custom selectors. The application features real-time updates, queue management, and data export capabilities.

## Live Demo

Visit the live application at: [http://crawler.onthis.website/](http://crawler.onthis.website/)

## Features

- 🔍 Multi-URL crawling with custom selectors
- 📊 Real-time crawl status updates via WebSocket
- 📈 Queue management with Bull and Redis
- 💾 Data export to CSV and Excel
- 🔄 Support for child selectors and nested data extraction
- 🎯 Domain-specific selector templates
- 📱 Responsive UI with Vuetify
- 🔒 User authentication and authorization

## Tech Stack

### Frontend

- Vue.js 3 with Composition API
- Vuetify 3 for UI components
- TailwindCSS for styling
- Pinia for state management
- Vue Router for navigation
- Socket.io-client for real-time updates
- Axios for API requests

### Backend

- Node.js with Express
- MongoDB with Mongoose
- Bull for job queue management
- Redis for queue storage
- Socket.io for real-time communication
- Playwright for web scraping
- Cheerio for HTML parsing
- HuggingFace for AI integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/crawler.git
cd crawler
```

2. Install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create environment files:

For server (.env):

```env
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
PORT=3001
WORKER_PORT=3002
```

For client (.env):

```env
VITE_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3002
```

## Running the Application

1. Start the server (in the server directory):

```bash
npm run dev
```

2. Start the client (in the client directory):

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Worker: http://localhost:3002

## Project Structure

```
crawler/
├── client/                 # Frontend Vue.js application
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── views/        # Page components
│   │   ├── stores/       # Pinia stores
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
│
└── server/                # Backend Node.js application
    ├── src/
    │   ├── controllers/  # Route controllers
    │   ├── models/       # Mongoose models
    │   ├── queues/       # Bull queue configurations
    │   └── utils/        # Utility functions
    └── files/            # Temporary file storage
```

## API Endpoints

- `POST /api/startcrawl` - Start a new crawl
- `GET /api/getcrawler/:id` - Get crawl details
- `GET /api/getallcrawlers` - List all crawls
- `POST /api/createcrawler` - Create a new crawl
- `PUT /api/updatecrawler/:id` - Update a crawl
- `DELETE /api/deletecrawl/:id` - Delete a crawl
- `GET /api/queuestatus/:id` - Get queue status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- [Vue.js](https://vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)
- [Bull](https://github.com/OptimalBits/bull)
- [Playwright](https://playwright.dev/)
