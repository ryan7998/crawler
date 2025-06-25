/**
 * seedLeasingDreamSelectors.js
 * One-file seeder that stores all CSS selectors for leasing.dream.ca
 * and pushes them to MongoDB.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

/* -------------------------------------------------------------------------- */
/*  Selector definition                                                       */
/* -------------------------------------------------------------------------- */
const leasingDreamSelectors = [
  {
    domain: 'leasing.dream.ca',
    selectors: [
      {
        /* container = one row in the “Availabilities” list ------------------ */
        name: 'vacancy_data',
        selector: "div[class^='SuiteListItem_suiteInfoContainer']",
        type: 'container',

        /* child cells ------------------------------------------------------- */
        childSelectors: [
          {
            name: 'suite_number',
            selector: "div[class^='SuiteListItem_suiteNameAndTag'] a",
            type: 'text'
          },
          {
            name: 'size',
            selector: "div[class^='SuiteListItem_suiteArea']",
            type: 'text'
          },
          {
            name: 'availability',
            selector: "div[class^='SuiteListItem_availabilityDate']",
            type: 'text'
          },
          {
            name: 'base_rent',
            selector: "div[class^='SuiteListItem_baseRent']",
            type: 'text'
          },
          {
            name: 'additional_rent',
            selector: "div[class^='SuiteListItem_additionalRent']",
            type: 'text'
          }
        ]
      }
    ],
    htmlChecksum: 'initial-checksum',
    lastChecked: new Date()
  }
];

/* -------------------------------------------------------------------------- */
/*  Seeder                                                                    */
/* -------------------------------------------------------------------------- */
const seedLeasingDreamSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // Remove any stale definitions for this domain
    await Selectors.deleteMany({ domain: 'leasing.dream.ca' });
    console.log('Cleared existing leasing.dream.ca selectors');

    // Insert the fresh set
    const inserted = await Selectors.insertMany(leasingDreamSelectors);
    console.log('Seeded selectors:', inserted);
  } catch (err) {
    console.error('Error seeding leasing.dream.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedLeasingDreamSelectors();
