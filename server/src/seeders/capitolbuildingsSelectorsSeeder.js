/**
 * seedCapitolSelectors.js
 * Usage: node seedCapitolSelectors.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Selectors  = require('../models/Selectors');

const capitolSelectors = [
  {
    domain: 'capitolbuildings.com',
    selectors: [
      {
        name: 'vacancy_data',
        selector: '#available-suites .office-space-card',
        type: 'container',
        childSelectors: [
          { name: 'suite_number',    selector: '.content-area h3.title',                        type: 'text' },
          { name: 'size_sf',         selector: ".content-area span.title:contains('Size')",     type: 'text' },
          { name: 'rate',            selector: ".content-area span.title:contains('Rate')",     type: 'text' },
          { name: 'availability',    selector: ".content-area span.title:contains('Availability')", type: 'text' },
          { name: 'detail_page',     selector: '.content-footer-area a.btn-primary:first-of-type', type: 'link', attribute: 'href' },
          { name: 'brochure_pdf',    selector: ".content-footer-area a.btn-primary[href$='.pdf']",  type: 'link', attribute: 'href' }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedCapitolSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // wipe and seed for this domain
    await Selectors.deleteMany({ domain: 'capitolbuildings.com' });
    console.log('Cleared old capitolbuildings.com selectors');

    const saved = await Selectors.insertMany(capitolSelectors);
    console.log('capitolbuildings.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding capitolbuildings.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedCapitolSelectors();
