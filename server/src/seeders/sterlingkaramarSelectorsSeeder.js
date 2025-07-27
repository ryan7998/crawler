/**
 * Seed file – selectors for sterlingkaramar.com
 * run:  node seedSterlingKaramar.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const sterlingKaramarSelectors = [
  {
    domain: 'www.sterlingkaramar.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:     'title',                                        // “10 Unionville Gate”
        selector: 'h1.property-hero__building-name',
        type:     'text'
      },
      {
        name:     'address',                                      // “10 Unionville Gate, Markham …”
        selector: 'p.property-hero__building-address',
        type:     'text'
      },

      // ——— Availability table (populated dynamically) ———
      {
        name:     'vacancy_data',
        /*  Each available space is rendered into its own card/row
            once site JS finishes; the two selectors below catch
            either layout.                                                  */
        selector: 'section#availability .suite, div.availability-row',
        type:     'container',
        childSelectors: [
          {
            name:     'suite_number',           // may be blank if site omits it
            selector: '.suite-header, .suite-number',
            type:     'text'
          },
          {
            name:     'space_type',
            selector: '.suite-type, .space-type',
            type:     'text'
          },
          {
            name:     'lease_rate',
            selector: '.suite-rate, .lease-rate',
            type:     'text'
          },
          {
            name:     'total_space',
            selector: '.suite-size, .total-space',
            type:     'text'
          },
          {
            name:     'floor',
            selector: '.suite-floor, .floor',
            type:     'text'
          },
          {
            name:     'available_date',
            selector: '.suite-available-date, .available-date',
            type:     'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedSterlingKaramarSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'www.sterlingkaramar.com' });
    console.log('Cleared existing sterlingkaramar.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(sterlingKaramarSelectors);
    console.log('sterlingkaramar.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding sterlingkaramar.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedSterlingKaramarSelectors();
