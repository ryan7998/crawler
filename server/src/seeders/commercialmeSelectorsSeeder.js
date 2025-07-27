/**
 * Seed file – selectors for commercialme.orlandocorp.com (5800 Hurontario Street)
 * run:  node seedOrlando5800Hurontario.js
 *
 * This page contains an Availability ▸ Office accordion with a single suite (1201).
 * We treat every <tr class="space"> row as a `vacancy_data` container.  Each
 * child selector pulls values from the nested <li><b>Label</b><span>Value</span>
 * pairs under <section class="space-details">.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const orlando5800Selectors = [
  {
    domain: 'commercialme.orlandocorp.com',
    selectors: [
      // ——— Page-level selectors ———
      { name: 'title',           selector: 'div.property-header h1',                    type: 'text' },
      { name: 'address',         selector: 'div.property-header .location h2',          type: 'text' },
      { name: 'property_status', selector: 'div.price span.type',                       type: 'text' },
      { name: 'asking_rate',     selector: 'div.price span:first-child',                type: 'text' },
      { name: 'date_updated',    selector: 'ul.inline-columns.date-update span',        type: 'text' },
      { name: 'description',     selector: 'div.property-details-description div.description-text', type: 'text' },

      // ——— Vacancy data ———
      {
        name: 'vacancy_data',
        selector: '#availabilitySection tr.space',     // each expanded suite details row
        type:   'container',
        childSelectors: [
          { name: 'suite',                selector: "li:contains('Suite') span",                    type: 'text' },
          { name: 'space_number',         selector: "li:contains('Space Number') span",            type: 'text' },
          { name: 'space_type',           selector: "li:contains('Space Type') span",              type: 'text' },
          { name: 'total_space',          selector: "li:contains('Total Space Available') span",   type: 'text' },
          { name: 'floor',                selector: "li:contains('Floor') span",                   type: 'text' },
          { name: 'divisible_space',      selector: "li:contains('Divisible Space') span",        type: 'text' },
          { name: 'build_type',           selector: "li:contains('Build Type') span",             type: 'text' },
          { name: 'lease_rate',           selector: "li:contains('Lease Rate') span",             type: 'text' },
          { name: 'additional_rent',      selector: "li:contains('Additional Rent') span",        type: 'text' },
          { name: 'available_date',       selector: "li:contains('Available Date') span",         type: 'text' },
          { name: 'lease_term',           selector: "li:contains('Lease Term') span",             type: 'text' },
          { name: 'suite_description',    selector: 'section.space-description p',                 type: 'text' }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedOrlando5800 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'commercialme.orlandocorp.com', 'selectors.name': 'vacancy_data', 'selectors.selector': { $regex: '#availabilitySection' } });
    console.log('Cleared existing suite-level selectors for commercialme.orlandocorp.com');

    const saved = await Selectors.insertMany(orlando5800Selectors);
    console.log('Selectors seeded for 5800 Hurontario Street:', saved);
  } catch (err) {
    console.error('Error seeding 5800 Hurontario Street selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedOrlando5800();
