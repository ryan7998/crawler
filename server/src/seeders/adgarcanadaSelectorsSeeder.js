const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

const adgarcanadaSelectors = [
    {
        domain: 'adgarcanada.com',
        selectors: [
          {
            name: "vacancy_data",
            selector: "#vacancy_table table tbody tr",
            type: "container",
            childSelectors: [
              {
                name: "floor",
                selector: "td[data-label='Floor']",
                type: "text"
              },
              {
                name: "suite_number",
                selector: "td[data-label='Suite #']", 
                type: "text"
              },
              {
                name: "plans_link",
                selector: "td[data-label='Plans'] a",
                type: "link",
                attribute: "href"
              },
              {
                name: "area_sf",
                selector: "td[data-label='Area (sf)']",
                type: "text"
              },
              {
                name: "availability",
                selector: "td[data-label='Availability']",
                type: "text"
              },
              {
                name: "features",
                selector: "td[data-label='Features']",
                type: "text"
              },
              {
                name: "suite_photos",
                selector: "td[data-label='Suite Photos']",
                type: "text"
              }
            ]
          }
        ],
        htmlChecksum: 'test-checksum',
        lastChecked: new Date()
    }
];

const seedAdgarcanadaSelectors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Clear existing selectors for amazon.ca
        await Selectors.deleteMany({ domain: 'adgarcanada.com' });
        console.log('Cleared existing adgarcanada.com selectors');

        // Insert new selectors
        const savedSelectors = await Selectors.insertMany(adgarcanadaSelectors);
        console.log('adgarcanada.com selectors seeded:', savedSelectors);

    } catch (error) {
        console.error('Error seeding adgarcanada.com selectors:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Run the seeder
seedAdgarcanadaSelectors(); 