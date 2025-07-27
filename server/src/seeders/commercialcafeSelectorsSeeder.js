/**
 * Seed file - selectors for commercialcafe.com
 * run:  node seedCommercialCafe.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Selectors  = require('../models/Selectors');

const commercialCafeSelectors = [
  {
    domain: 'www.commercialcafe.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:  'title',
        selector: 'div.property-header h1',          // “Scotia Plaza - 44 King Street West”
        type:  'text'
      },

      // ——— Availability table ———
      {
        name:  'vacancy_data',
        // each space sits inside its own <tr class="space"> row in the “Spaces Available” table
        selector: '#availabilitySection table.availability tr.space',
        type: 'container',
        childSelectors: [
          {
            name:  'suite_number',                   // li <b>Space Number</b><span>…</span>
            selector: "li:contains('Space Number') span",
            type:  'text'
          },
          {
            name:  'space_type',                     // li <b>Space Type</b><span>…</span>
            selector: "li:contains('Space Type') span",
            type:  'text'
          },
          {
            name:  'lease_rate',                     // li <b>Lease Rate</b> (may be link or span)
            selector: "li:contains('Lease Rate') a, li:contains('Lease Rate') span",
            type:  'text'
          },
          {
            name:  'total_space',                    // li <b>Total Space Available</b><span>…</span>
            selector: "li:contains('Total Space Available') span",
            type:  'text'
          },
          {
            name:  'floor',
            selector: "li:contains('Floor') span",
            type:  'text'
          },
          {
            name:  'available_date',
            selector: "li:contains('Available Date') span",
            type:  'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedCommercialCafeSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove any old entries for this domain
    await Selectors.deleteMany({ domain: 'commercialcafe.com' });
    console.log('Cleared existing commercialcafe.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(commercialCafeSelectors);
    console.log('commercialcafe.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding commercialcafe.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedCommercialCafeSelectors();
