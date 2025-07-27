/**
 * Seeder: humboldproperties.com selectors
 * --------------------------------------
 * Grabs availability rows from any “tablepress-…” availability
 * table on Humbold Properties building pages.
 *
 * Container  → each <tr> in the table body
 * Children   → cell values (unit, size, dates, rents …)
 */

const mongoose   = require('mongoose');
require('dotenv').config();
const Selectors  = require('../models/Selectors');

const humboldSelectors = [
  {
    domain: 'humboldproperties.com',
    selectors: [
      {
        /* every vacancy row inside any tablepress table               */
        name:     'vacancy_data',
        selector: "div[id^='tablepress'] table tbody tr",
        type:     'container',

        /* ← NEW: where to find the heading that belongs to this table  */
        headingSelector: "div[id^='tablepress']"
                         .concat(" > table")          // current table
                         .concat("::preceding-h4"),   // (handled in helper)

        childSelectors: [
          {
            name:   'suite_number',
            selector: 'td.column-1',
            type:   'text',

            /* ← NEW: tell helper to combine with heading text          */
            format: '%s (%s)'           //    e.g. "104 (1120 Finch …)"
          },
          { name: 'area_sf',       selector: 'td.column-2', type: 'text' },
          { name: 'availability',  selector: 'td.column-3', type: 'text' },
          { name: 'market_rent',   selector: 'td.column-4', type: 'text' },
          { name: 'tmi_2025',      selector: 'td.column-5', type: 'text' }
        ]
      }
    ],
    htmlChecksum: 'humbold-finch-v1',
    lastChecked: new Date()
  }
];

async function seedHumboldSelectors() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // remove any existing definitions for this domain
    await Selectors.deleteMany({ domain: 'humboldproperties.com' });
    console.log('Cleared existing humboldproperties.com selectors');

    // insert the new definition
    const saved = await Selectors.insertMany(humboldSelectors);
    console.log('humboldproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding humboldproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// execute directly
seedHumboldSelectors();