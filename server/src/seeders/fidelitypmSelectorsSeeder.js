/**
 * seed_fidelitypm_selectors.js
 *
 *  – Adds selectors for fidelitypm.com (Rentsync template pages).
 *  – Container = every <div class="suite-row"> block.
 *  – Children   = individual <li class="info-block"> lines inside each suite.
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const Selectors  = require('../models/Selectors');

const fidelitypmSelectors = [
  {
    domain: 'fidelitypm.com',
    selectors: [
      {
        // one row per suite / unit
        name: 'vacancy_data',
        selector: 'div.suite-row',          // container  :contentReference[oaicite:2]{index=2}
        type: 'container',
        childSelectors: [
          {
            name: 'suite_type',
            selector: '.suite-box .suite-type', // “OFFICE”, “Office”, etc.
            type: 'text'
          },
          {
            name: 'square_feet',
            selector: "li:contains('Square feet') span.info",
            type: 'text'
          },
          {
            name: 'rent_from',
            selector: "li:contains('Rent From') span.info",
            type: 'text'
          },
          {
            name: 'contract_type',
            selector: "li:contains('Contract Type') span.info",
            type: 'text'
          },
          {
            name: 'availability',
            selector: "li:contains('Availability') span.info",
            type: 'text'
          },
          {
            name: 'floorplans_link',
            selector: "li:contains('Floorplans') a",
            type: 'link',
            attribute: 'href'          // pdf or jpg link
          },
          {
            name: 'suite_photos',
            selector: "li:contains('Suite Photos') a",
            type: 'link',
            attribute: 'href'
          }
        ]
      }
    ],
    htmlChecksum: 'initial-checksum',        // replace with Sha-1 if you keep a hash
    lastChecked : new Date()
  }
];

const seedFidelitypmSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // remove any old records for this domain (optional, keeps things idempotent)
    await Selectors.deleteMany({ domain: 'fidelitypm.com' });
    console.log('Cleared existing fidelitypm.com selectors');

    // insert the fresh set
    const saved = await Selectors.insertMany(fidelitypmSelectors);
    console.log('fidelitypm.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding fidelitypm.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedFidelitypmSelectors();
