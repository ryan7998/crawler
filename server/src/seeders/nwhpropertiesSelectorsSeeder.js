/**
 * Seed file – selectors for nwhproperties.com (Dundas‑Centre Medical example)
 * run:  node seedNWHDundasCentre.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const nwhSelectors = [
  {
    domain: 'nwhproperties.com',
    selectors: [
      // ——— Page‑level selectors ———
      {
        name:     'title',                                   // “Dundas‑Centre Medical”
        selector: 'h1.typography-heading-3',                 // unique page <h1>
        type:     'text'
      },
      {
        name:     'address',                                 // “220 Dundas Street West, Whitby, ON”
        selector: 'address',
        type:     'text'
      },

      // ——— Availability cards ———
      {
        name:     'vacancy_data',
        // each suite card sits inside a rounded‑small bordered <div> within the #suites section
        selector: '#suites div[class*="rounded-small"]',
        type:     'container',
        childSelectors: [
          {
            name:    'suite_number',                          // 102, 301, 302A …
            selector: 'h3',
            type:    'text'
          },
          {
            name:    'suite_size',                            // “741 SF”
            selector: "div:contains('Area') span.typography-body-base-bold",
            type:    'text'
          },
          {
            name:    'asking_rent',                           // “Market”
            selector: "div:contains('Asking Rent') span",
            type:    'text'
          },
          {
            name:    'additional_rent',                      // “$20.89/SF”
            selector: "div:contains('Additional Rent') span",
            type:    'text'
          },
          {
            name:    'availability_date',                    // “Immediate”
            selector: "div:contains('Availability') span",
            type:    'text'
          },
          {
            name:    'move_in_ready',                        // badge text (optional)
            selector: 'span.typography-micro',
            type:    'text'
          },
          {
            name:    'suite_notes',                          // marketing blurb
            selector: 'div.prose-sm p',
            type:    'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',    // update during production seeding
    lastChecked:  new Date()
  }
];

const seedNWHSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'nwhproperties.com' });
    console.log('Cleared existing nwhproperties.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(nwhSelectors);
    console.log('nwhproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding nwhproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedNWHSelectors();
