/**
 * seedGreenwinSelectors.js
 * — Seeds selectors for greenwin.ca (14 Duncan St.). —
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Selectors  = require('../models/Selectors');

const greenwinSelectors = [
  {
    domain: 'greenwin.ca',
    selectors: [
      {
        // <div class="suite commercial-suite-details"> … </div> :contentReference[oaicite:2]{index=2}
        name: 'available_units',
        selector: '.suite.commercial-suite-details',
        type: 'container',

        /** Child selectors **/
        childSelectors: [
          // FLOOR:
          {
            name: 'floor',
            selector: ".top-content:has(h3.suite-type:contains('FLOOR')) .suite-type-text",
            type: 'text',
          },
          // UNIT / SUITE:
          {
            name: 'unit',
            selector: ".top-content:has(h3.suite-type:contains('UNIT')) .suite-type-text",
            type: 'text',
          },
          // AVAIL. SQFT:
          {
            name: 'available_sqft',
            selector: ".top-content:has(h3.suite-type:contains('AVAIL. SQFT')) .suite-type-text",
            type: 'text',
          },
          // Asking NET Rent:
          {
            name: 'asking_net_rent',
            selector: ".bottom-content:has(h3.suite-type:contains('Asking NET Rent')) .suite-type-text",
            type: 'text',
          },
          // ADDITIONAL RENT:
          {
            name: 'additional_rent',
            selector: ".bottom-content:has(h3.suite-type:contains('ADDITIONAL RENT')) .suite-type-text",
            type: 'text',
          },
          // AVAILABLE ON:
          {
            name: 'available_on',
            selector: ".bottom-content:has(h3.suite-type:contains('AVAILABLE ON')) .suite-type-text",
            type: 'text',
          },
          // Floorplans note
          {
            name: 'floorplans',
            selector: ".detail.floorplans",
            type: 'text',
          },
        ],
      },
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date(),
  },
];

async function seedGreenwinSelectors() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // Clear any existing selectors for this domain
    await Selectors.deleteMany({ domain: 'greenwin.ca' });
    console.log('Cleared existing greenwin.ca selectors');

    // Insert new selectors
    const saved = await Selectors.insertMany(greenwinSelectors);
    console.log('greenwin.ca selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding greenwin.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeder
seedGreenwinSelectors();
