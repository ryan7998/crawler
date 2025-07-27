const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

const alliedReidSelectors = [
    {
        domain: 'alliedreit.com',
        selectors: [
          {
            name: "suite_data",
            selector: ".accordion-06-item",
            type: "container",
            childSelectors: [
              {
                name: "suite_number",
                selector: ".accordion-button h3.number",
                type: "text"
              },
              {
                name: "type",
                selector: ".accordion-button p.type",
                type: "text"
              },
              {
                name: "size",
                selector: ".accordion-button p.size",
                type: "text"
              },
              {
                name: "availability",
                selector: ".accordion-button p.avail",
                type: "text"
              },
              {
                name: "net_rent",
                selector: ".accordion-content .section:nth-child(4) p.body",
                type: "text"
              },
              {
                name: "additional_rent",
                selector: ".accordion-content .section:nth-child(5) p.body",
                type: "text"
              },
              {
                name: "additional_info",
                selector: ".accordion-content .section.links p",
                type: "text"
              },
              {
                name: "copy_link",
                selector: ".accordion-content .section.links a.copyLink",
                type: "link",
                attribute: "data-link"
              }
            ]
          }
        ],
        htmlChecksum: 'test-checksum',
        lastChecked: new Date()
    }
];

const seedAlliedReidSelectors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Clear existing selectors for amazon.ca
        await Selectors.deleteMany({ domain: 'alliedreit.com' });
        console.log('Cleared existing alliedreit.com selectors');

        // Insert new selectors
        const savedSelectors = await Selectors.insertMany(alliedReidSelectors);
        console.log('alliedreit.com selectors seeded:', savedSelectors);

    } catch (error) {
        console.error('Error seeding alliedreit.com selectors:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Run the seeder
seedAlliedReidSelectors(); 