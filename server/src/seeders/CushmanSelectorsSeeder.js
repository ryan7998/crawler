const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

/**
 * CSS-selector mapping for Cushman & Wakefield property pages
 */
const cushmanSelectors = [
  {
    domain: 'cushmanwakefield.com',
    selectors: [
      {
        name: 'availabilities',
        selector: 'div.availabilities-container',   // container
        type: 'container',
        childSelectors: [
          {
            name: 'suite',
            selector: 'div.availabilities-title p.blue-color-title span:last-child',
            type: 'text'
          },
          {
            name: 'available_space',
            selector: '.availabilities-description > div.availabilities-second-level-description:first-child b.bold-font',
            type: 'text'
          },
          {
            name: 'rental_price',
            selector: '.availabilities-description div.rentalPrice b.bold-font',
            type: 'text'
          },
          {
            name: 'rate_type',
            selector: '.availabilities-description div.availabilities-second-level-description:has(p:contains("Rate Type")) b.bold-font',
            type: 'text'
          },
          {
            name: 'min_max_contiguous',
            selector: '.availabilities-description div.availabilities-second-level-description:has(p:contains("Min/Max Contiguous")) b.bold-font',
            type: 'text'
          },
          {
            name: 'sublease',
            selector: '.availabilities-description div.availabilities-second-level-description:has(p:contains("Sublease")) b.bold-font',
            type: 'text'
          },
          {
            name: 'available_date',
            selector: '.availabilities-description div.availableData b.bold-font',
            type: 'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedCushmanSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // remove any old mapping for this domain
    await Selectors.deleteMany({ domain: 'cushmanwakefield.com' });
    console.log('Cleared existing cushmanwakefield.com selectors');

    // insert fresh mapping
    const saved = await Selectors.insertMany(cushmanSelectors);
    console.log('cushmanwakefield.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding cushmanwakefield.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeder
seedCushmanSelectors();
