/**
 *  Seeder for www.jilanigroup.com – 5100 Orbitor Drive
 *  ---------------------------------------------------
 *  • title         – <span style="font-size:30px …> inside the header
 *  • vacancy_data  – every <div.bc-text-content …> that contains the word “Suite”
 *      └─ suite_number – text of the <span> itself (“Suite xxx: #,### SF …”)
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

const jilanigroupSelectors = [
  {
    domain: 'www.jilanigroup.com',
    selectors: [
      // ------ page header ---------------------------------------------------
      {
        name: 'title',
        selector: "div.bc-text-content span[style*='font-size:30']",
        type: 'text'
      },

      // ------ each vacancy line --------------------------------------------
      {
        name: 'vacancy_data',
        // every bc-text-content that has the word “Suite” in it
        selector: "div.bc-text-content:contains('Suite')",
        type: 'container',
        childSelectors: [
          {
            name: 'suite_number',
            selector: 'span',          // the <span> inside the container
            type: 'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedJilaniSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // clear and replace existing selectors for this domain
    await Selectors.deleteMany({ domain: 'jilanigroup.com' });
    await Selectors.insertMany(jilanigroupSelectors);

    console.log('jilanigroup.com selectors seeded');
  } catch (error) {
    console.error('Error seeding selectors:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedJilaniSelectors();
