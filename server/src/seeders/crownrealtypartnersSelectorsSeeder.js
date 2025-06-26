/**
 * seed_crownrealtypartners_selectors.js
 *
 *  - Creates/updates selector metadata for crownrealtypartners.com
 *  - Run with:  node seed_crownrealtypartners_selectors.js
 */

const mongoose   = require('mongoose');
require('dotenv').config();
const Selectors  = require('../models/Selectors');

const crownSelectors = [
  {
    domain: 'crownrealtypartners.com',
    selectors: [
      {
        name: 'availability_rows',
        // every availability line-item (skip header & “grandparent” rows)
        selector: '#property-suites .vts-single-listing[id^="vsl-"]',
        type: 'container',
        childSelectors: [
          {
            name: 'suite',
            selector: '.vts-single-listing__data-suite',
            type: 'text',
          },
          {
            name: 'area',
            selector: '.vts-single-listing__data-area',
            type: 'text',
          },
          {
            name: 'net_rent',
            selector: '.vts-single-listing__data-net-rent',
            type: 'text',
          },
          {
            name: 'availability',
            selector: '.vts-single-listing__data-availability',
            type: 'text',
          },
          {
            name: 'comments',
            selector: '.vts-single-listing__data-comments',
            type: 'text',
          },
          {
            // floor-plan PDF (if present)
            name: 'floor_plan_link',
            selector: '.vts-single-comments-media a[title*="Floor Plan"]',
            type: 'link',
            attribute: 'href',
          },
        ],
      },
    ],
    htmlChecksum: 'test-checksum',   // replace with your real checksum
    lastChecked: new Date(),
  },
];

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
    console.log('MongoDB connected');

    // remove any previous selector sets for this domain
    await Selectors.deleteMany({ domain: 'crownrealtypartners.com' });

    const inserted = await Selectors.insertMany(crownSelectors);
    console.log('crownrealtypartners.com selectors seeded:', inserted);
  } catch (err) {
    console.error('Error seeding selectors:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
