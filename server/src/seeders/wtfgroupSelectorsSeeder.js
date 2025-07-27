/**
 * Seed file – selectors for wtfgroup.com (116 Spadina Avenue)
 * run:  node seedWTF116Spadina.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const wtfSelectors = [
  {
    domain: 'wtfgroup.com',
    selectors: [
      // ——— Page‑level selectors ———
      {
        name:     'title',                 // “116 Spadina”
        selector: 'h2.property-title',
        type:     'text'
      },
      {
        name:     'description',           // marketing blurb under title
        selector: 'p.description',
        type:     'text'
      },

      // ——— Availability table ———
      {
        name:     'vacancy_data',
        // skip the header row by excluding the first .suite-row
        selector: 'div.suite-box div.suite-row:not(:first-child)',
        type:     'container',
        childSelectors: [
          {
            name:  'suite_number',                        // “100”, “202”…
            selector: 'div.suite-col:first-child a',
            type:   'text'
          },
          {
            name:  'suite_term',                          // e.g. “5 years”
            selector: 'div.suite-col:nth-child(2)',
            type:   'text'
          },
          {
            name:  'suite_size',                          // e.g. “7,411 sq ft”
            selector: 'div.suite-col:nth-child(3)',
            type:   'text'
          },
          {
            name:  'occupancy',                           // e.g. “Immediate”
            selector: 'div.suite-col:nth-child(4)',
            type:   'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedWTFSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove old entries for this domain (property pages)
    await Selectors.deleteMany({ domain: 'wtfgroup.com' });
    console.log('Cleared existing wtfgroup.com selectors');

    const saved = await Selectors.insertMany(wtfSelectors);
    console.log('wtfgroup.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding wtfgroup.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedWTFSelectors();
