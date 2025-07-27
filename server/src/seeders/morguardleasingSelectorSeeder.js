/**
 * Seed file – selectors for morguardleasing.com (55 City Centre Drive page example)
 * run:  node seedMorguard55CityCentre.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const morguardSelectors = [
  {
    domain: 'morguardleasing.com',
    selectors: [
      // ——— Page‑level selectors ———
      {
        name:     'title',                                   // “MCC (55 City Centre Drive)”
        selector: 'div[class^="BuildingContainer_nameAddress"] h1',
        type:     'text'
      },
      {
        name:     'address',                                 // “55 City Centre Drive, Mississauga, Ontario L5B 1M3”
        selector: 'div[class^="BuildingContainer_nameAddress"] address',
        type:     'text'
      },

      // ——— Availability table ———
      {
        name:     'vacancy_data',
        // each suite sits inside its own .SuiteListItem_suiteInfoContainer… wrapper
        selector: 'div[class^="SuiteListItem_suiteInfoContainer"]',
        type:     'container',
        childSelectors: [
          {
            name:     'suite_number',                         // 200, 400, 403, …
            selector:  'div[class^="SuiteListItem_suiteNameAndTag"] div',
            type:      'text'
          },
          {
            name:     'suite_size',                           // “11,998 sf”
            selector:  'div[class^="SuiteListItem_suiteArea"]',
            type:      'text'
          },
          {
            name:     'availability_date',                    // “Immediately” or a date
            selector:  'div[class^="SuiteListItem_availabilityDate"]',
            type:      'text'
          },
          {
            name:     'base_rent',                            // “$ 15.75 /sf”
            selector:  'div[class^="SuiteListItem_baseRent"]',
            type:      'text'
          },
          {
            name:     'additional_rent',                      // “$ 22.66 /sf”
            selector:  'div[class^="SuiteListItem_additionalRent"]',
            type:      'text'
          },
          {
            name:     'suite_type',                           // “Office”
            selector:  'div[class^="SuiteListItem_suiteType"]',
            type:      'text'
          },
          {
            name:     'contiguous_area',                      // optional – shows only when contiguous
            selector:  'div[class^="SuiteListItem_sizeRange"]',
            type:      'text'
          },
          {
            name:     'suite_notes',                          // marketing notes / comments
            selector:  'div[class^="SuiteListItem_suiteNotesNotExpanded"]',
            type:      'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',    // update during production seeding
    lastChecked:  new Date()
  }
];

const seedMorguardSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'morguardleasing.com' });
    console.log('Cleared existing morguardleasing.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(morguardSelectors);
    console.log('morguardleasing.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding morguardleasing.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedMorguardSelectors();
