/**
 * Seed file – selectors for riocan.com (1293 Bloor Street West)
 * run:  node seedRioCan1293Bloor.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const riocanSelectors = [
  {
    domain: 'www.riocan.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:  'title',                                   // “1293 Bloor Street West”
        selector: 'h1',
        type:  'text'
      },
      {
        name:  'address',                                 // “1293 Bloor St W, Toronto, Ontario M6H 1P1”
        selector: 'div[data-content="address"]',
        type:  'text'
      },
      {
        name:  'property_overview',                       // introductory paragraph under Overview
        selector: 'div.overview p',
        type:  'text'
      },

      // ——— Tenant / availability list ———
      {
        name: 'vacancy_data',
        // current tenants list (each li holds tenant row)
        selector: 'ol.list-tenants li',
        type:   'container',
        childSelectors: [
          {
            name:    'suite_number',                      // first <span> value (may just be index)
            selector: 'span:nth-child(1)',
            type:    'text'
          },
          {
            name:    'tenant_name',                       // second <span> value
            selector: 'span:nth-child(2)',
            type:    'text'
          },
          {
            name:    'suite_size',                        // third <span> value
            selector: 'span:nth-child(3)',
            type:    'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedRioCanSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'www.riocan.com' });
    console.log('Cleared existing riocan.com selectors');

    const saved = await Selectors.insertMany(riocanSelectors);
    console.log('riocan.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding riocan.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedRioCanSelectors();
