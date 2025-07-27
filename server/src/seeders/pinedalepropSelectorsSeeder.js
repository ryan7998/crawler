/**
 * Seed file – selectors for pinedaleprop.com / Commercial Properties
 * run:  node seedPinedaleCommercial.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const pinedaleSelectors = [
  {
    domain: 'pinedaleprop.com',
    selectors: [
      // —— Page–level selector ——
      {
        name:  'title',
        selector: 'h1',                    // “Commercial Properties”
        type:  'text'
      },

      // —— Property cards ——
      {
        name:  'vacancy_data',
        // every listing sits in the right-hand column that follows the image
        selector: 'div.col_half.col_last',
        type:    'container',
        childSelectors: [
          {
            name:  'suite_number',         // (not provided on this page – will be blank)
            selector: "li:contains('Suite Number') span",
            type:  'text'
          },
          {
            name:  'property_address',     // “970 Lawrence Avenue West”, etc.
            selector: 'h4 span.dev-current',
            type:  'text'
          },
          {
            name:  'description',          // paragraph text under each heading
            selector: 'p',
            type:  'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedPinedaleSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'pinedaleprop.com' });
    console.log('Cleared existing pinedaleprop.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(pinedaleSelectors);
    console.log('pinedaleprop.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding pinedaleprop.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedPinedaleSelectors();
