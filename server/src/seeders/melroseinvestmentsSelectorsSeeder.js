/**
 * Seed file - selectors for melroseinvestments.com
 * run:  node seedMelroseInvestments.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const melroseSelectors = [
  {
    domain: 'melroseinvestments.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name: 'title',
        selector: 'h1.elementor-heading-title.elementor-size-default',
        type: 'text'
      },
      {
        name: 'address',
        selector: 'h2.elementor-heading-title.elementor-size-default',
        type: 'text'
      },

      // ——— Custom card-based leasing data ———
      {
        name: 'vacancy_data',
        selector: 'div.w-100.p-3.bg-white.text-center',
        type: 'container',
        childSelectors: [
          {
            name: 'suite_number',
            selector: 'h5.text-secondary',
            type: 'text'
          },
          {
            name: 'area_sf',
            selector: 'p.m-0',
            type: 'text'
          },
          {
            name: 'plans_link',
            selector: 'a.btn',
            type: 'link',
            attribute: 'href'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedMelroseSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'melroseinvestments.com' });
    console.log('Cleared existing melroseinvestments.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(melroseSelectors);
    console.log('melroseinvestments.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding melroseinvestments.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedMelroseSelectors();
