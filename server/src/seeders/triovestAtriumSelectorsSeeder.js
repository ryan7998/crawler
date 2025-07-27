/**
 * Seed file – selectors for leasing.triovest.com (Atrium – 595 Bay Street)
 * run:  node seedTriovestAtrium.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const triovestSelectors = [
  {
    domain: 'leasing.triovest.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:     'title',                                   // “Atrium - Office”
        selector: 'div[class^="BuildingContainer_nameAddress"] h1',
        type:     'text'
      },
      {
        name:     'address',                                 // “595 Bay Street, Toronto, Ontario M5G 2R3”
        selector: 'div[class^="BuildingContainer_nameAddress"] address',
        type:     'text'
      },

      // ——— Availability table ———
      {
        name:     'vacancy_data',
        // each suite row container
        selector: 'div[class^="SuiteListItem_suiteInfoContainer"]',
        type:     'container',
        childSelectors: [
          {
            name:     'suite_number',                         // “200”, “300B” …
            selector:  'div[class^="SuiteListItem_suiteNameAndTag"] div',
            type:      'text'
          },
          {
            name:     'suite_size',                           // “67,926 sf”
            selector:  'div[class^="SuiteListItem_suiteArea"]',
            type:      'text'
          },
          {
            name:     'availability_date',                    // “Immediately” or a date
            selector:  'div[class^="SuiteListItem_availabilityDate"]',
            type:      'text'
          },
          {
            name:     'additional_rent',                      // “$ 27.99 /sf”
            selector:  'div[class^="SuiteListItem_additionalRent"]',
            type:      'text'
          },
          {
            name:     'base_rent',                            // only if present on some suites
            selector:  'div[class^="SuiteListItem_baseRent"]',
            type:      'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',    // update with real checksum during seeding
    lastChecked:  new Date()
  }
];

const seedTriovestSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'leasing.triovest.com' });
    console.log('Cleared existing leasing.triovest.com selectors');

    const saved = await Selectors.insertMany(triovestSelectors);
    console.log('leasing.triovest.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding leasing.triovest.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedTriovestSelectors();
