/**
 * seed-davpart-selectors.js
 *
 * Inserts/updates selectors for davpart.ca - 67 Yonge St. “Available Units” table
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const davpartSelectors = [
  {
    domain: 'davpart.ca',
    selectors: [
      {
        /* rows inside “Available Units” */
        name: 'available_units',
        selector: 'section.details-available-units .row.details-available-units-content',   // each row:contentReference[oaicite:3]{index=3}
        type:   'container',
        childSelectors: [
          /* 1 ─ space / use-type (“office”, etc.) */
          {
            name:     'space_type',
            selector: '.col-sm-3.col-lg-2 p',
            type:     'text'
          },
          /* 2 ─ suite / unit number            */
          {
            name:     'suite',
            selector: '.col-sm-3.col-lg-1:nth-of-type(1) p',
            type:     'text'
          },
          /* 3 ─ rentable size (Sq. Ft.)        */
          {
            name:     'size_sf',
            selector: '.col-sm-3.col-lg-1:nth-of-type(2) p',
            type:     'text'
          },
          /* 4 ─ availability / possession date */
          {
            name:     'possession',
            selector: '.hidden-small.col-lg-2 p',
            type:     'text'
          },
          /* 5 ─ “T & O” (op-ex / additional)   */
          {
            name:     't_and_o',
            selector: '.hidden-small.col-lg-1 p',
            type:     'text'
          },
          /* 6 ─ comments (blank in sample)     */
          {
            name:     'comments',
            selector: '.hidden-small.col-lg-3',
            type:     'text'
          },
          /* 7 ─ unit-plan PDF / link           */
          {
            name:       'unit_plan',
            selector:   '.col-sm-3.col-lg-2 a',
            type:       'link',
            attribute:  'href'
          }
        ]
      }
    ],
    htmlChecksum: 'davpart-available-units-v1',   // optional checksum placeholder
    lastChecked:  new Date()
  }
];

const seedDavpartSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // clear any previous record for this domain
    await Selectors.deleteMany({ domain: 'davpart.ca' });
    console.log('Cleared existing davpart.ca selectors');

    // insert fresh record
    const saved = await Selectors.insertMany(davpartSelectors);
    console.log('davpart.ca selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding davpart.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// run it
seedDavpartSelectors();
