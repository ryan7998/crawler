/**
 * Seed file - selectors for lisgardev.ca
 * run:  node seedLisgarDev.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const lisgarDevSelectors = [
  {
    domain: 'lisgardev.ca',
    selectors: [
      // ——— Page-level selectors ———
      {
        name: 'title',
        selector: '#page-title h1',
        type: 'text'
      },
      {
        name: 'address',
        selector: 'h4.vc_custom_heading',
        type: 'text'
      },

      // ——— Property details in table ———
      {
        name: 'vacancy_data',
        selector: 'table tbody tr',
        type: 'container',
        childSelectors: [
          {
            name: 'field',
            selector: 'td:nth-child(1)',
            type: 'text'
          },
          {
            name: 'value',
            selector: 'td:nth-child(2)',
            type: 'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedLisgarDevSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'lisgardev.ca' });
    console.log('Cleared existing lisgardev.ca selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(lisgarDevSelectors);
    console.log('lisgardev.ca selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding lisgardev.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedLisgarDevSelectors();
