/**
 * Seed selectors for CBRE “General Information” pages.
 *
 * On some CBRE listings there is no distinct suite / unit number.
 * Instead, use the **“Available”** value (e.g. **“Now”**) as the
 * `suite_number`.  
 *
 * Run:  node seed/cbreSelectors.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Selectors  = require('../models/Selectors');

const cbreSelectors = [
  {
    domain: 'www.cbre.ca',
    selectors: [
      {
        /* ─────────────────────────────────────────────
           The whole “General Information” block
           ───────────────────────────────────────────── */
        name: 'vacancy_data',
        selector: 'div.leasesBlock div.cbre_table__row',   // container
        type:   'container',
        childSelectors: [
          /*   Column order in the CBRE markup:
               1 = Available, 2 = Lease Type, 3 = Gross Rent,
               4 = Additional Rent, 5 = Net Rent,
               6 = Zoning, 7 = Number of Storeys,
               8 = Year Built, 9 = Vacancy Status          */

          /* “Now” from the first cell becomes our pseudo suite number */
          {
            name:  'suite_number',                       // e.g. “Now”
            selector: 'div.cbre_table__cell:nth-child(1)',
            type:  'text'
          },
          {
            name:  'availability',
            selector: 'div.cbre_table__cell:nth-child(1)', // same cell
            type:  'text'
          },
          {
            name:  'lease_type',
            selector: 'div.cbre_table__cell:nth-child(2)',
            type:  'text'
          },
          {
            name:  'gross_rent',
            selector: 'div.cbre_table__cell:nth-child(3)',
            type:  'text'
          },
          {
            name:  'additional_rent',
            selector: 'div.cbre_table__cell:nth-child(4)',
            type:  'text'
          },
          {
            name:  'net_rent',
            selector: 'div.cbre_table__cell:nth-child(5)',
            type:  'text'
          },
          {
            name:  'zoning',
            selector: 'div.cbre_table__cell:nth-child(6)',
            type:  'text'
          },
          {
            name:  'number_of_storeys',
            selector: 'div.cbre_table__cell:nth-child(7)',
            type:  'text'
          },
          {
            name:  'year_built',
            selector: 'div.cbre_table__cell:nth-child(8)',
            type:  'text'
          },
          {
            name:  'vacancy_status',
            selector: 'div.cbre_table__cell:nth-child(9)',
            type:  'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

async function seedCbreSelectors () {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // Remove any old CBRE selector configs
    await Selectors.deleteMany({ domain: 'cbre.ca' });
    console.log('Cleared existing cbre.ca selectors');

    // Insert the new set
    const saved = await Selectors.insertMany(cbreSelectors);
    console.log('cbre.ca selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding cbre.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedCbreSelectors();
