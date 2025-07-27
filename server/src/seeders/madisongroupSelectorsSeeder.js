/**
 * Seed file - selectors for madisongroup.ca
 * run:  node seedMadisonGroup.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const madisonGroupSelectors = [
  {
    domain: 'madisongroup.ca',
    selectors: [
      // ——— Page-level selectors ———
      {
        name: 'title',
        selector: 'div.elementor-widget-heading h2.elementor-heading-title',
        type: 'text'
      },

      {
        name: 'address',
        selector: 'div.elementor-widget-heading h4.elementor-heading-title',
        type: 'text'
      },

      // ——— Availability rows ———
      {
        name: 'vacancy_data',
        selector: 'div.elementor-widget-theme-post-content table tr',
        type: 'container',
        childSelectors: [
          {
            name: 'suite_number',
            selector: 'td:nth-child(1)',
            type: 'text'
          },
          {
            name: 'area_sf',
            selector: 'td:nth-child(2)',
            type: 'text'
          },
          {
            name: 'availability',
            selector: 'td:nth-child(3)',
            type: 'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedMadisonGroupSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'madisongroup.ca' });
    console.log('Cleared existing madisongroup.ca selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(madisonGroupSelectors);
    console.log('madisongroup.ca selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding madisongroup.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedMadisonGroupSelectors();
