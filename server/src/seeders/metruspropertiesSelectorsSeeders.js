/**
 * Seed file – selectors for metrusproperties.com (498 Markland St.)
 * run:  node seedMetrus498Markland.js
 *
 * This property page shows an image gallery, description, and PDF resources
 * but no individual suite availability table.  We expose a single
 * `vacancy_data` container with the descriptive paragraph; no `suite_number`
 * field is included, per spec when suites are not present.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const metrusSelectors = [
  {
    domain: 'www.metrusproperties.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:     'title',                   // “498 Markland St.”
        selector: 'div.mainbody h1',
        type:     'text'
      },
      {
        name:     'address',                 // map link text (inside description)
        selector: 'div.desc a[href*="maps.google.com"]',
        type:     'text'
      },

      // ——— Vacancy placeholder (no suites) ———
      {
        name:     'vacancy_data',
        selector: 'div.desc',               // property description block
        type:     'container',
        childSelectors: [
          {
            name:   'property_description',
            selector: 'self',               // full text of div.desc
            type:    'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedMetrusSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'www.metrusproperties.com' });
    console.log('Cleared existing metrusproperties.com selectors');

    const saved = await Selectors.insertMany(metrusSelectors);
    console.log('metrusproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding metrusproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedMetrusSelectors();
