/**
 * Seed file – selectors for westdaleproperties.com (1450 Castlefield Avenue, Toronto)
 * run:  node seedWestdale1450Castlefield.js
 *
 * This page does **not** publish a suite-by-suite availability table.  To keep
 * the schema tidy, we expose a single `vacancy_data` container that includes
 * only the descriptive content—no `suite_number` field since none exists.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const westdaleSelectors = [
  {
    domain: 'www.westdaleproperties.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:     'title',                 // “Castlefield - 1450 Castlefield Avenue, Toronto”
        selector: 'h1.property_title',
        type:     'text'
      },
      {
        name:     'address',               // link text inside map-marker anchor
        selector: 'div#blkHeader a[href*="google.com/maps"]',
        type:     'text'
      },

      // ——— Vacancy placeholder (no suites) ———
      {
        name:     'vacancy_data',
        selector: 'div#txtDetail',        // About paragraph container
        type:     'container',
        childSelectors: [
          {
            name:  'property_description',
            selector: 'p',
            type:   'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedWestdaleSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'www.westdaleproperties.com' });
    console.log('Cleared existing westdaleproperties.com selectors');

    const saved = await Selectors.insertMany(westdaleSelectors);
    console.log('westdaleproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding westdaleproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedWestdaleSelectors();
