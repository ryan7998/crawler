/**
 * Seed file – selectors for polarisrealty.com (2680 Matheson Boulevard example)
 * run:  node seedPolaris2680Matheson.js
 *
 * NOTE: The Polaris Realty property pages do **not** list individual suites.  To
 * satisfy the crawler schema we still expose a `vacancy_data` container with an
 * always‑present `suite_number` field (empty).  The container surfaces the major
 * building facts that *are* available – primarily the architecture / systems
 * bullet lists.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const polarisSelectors = [
  {
    domain: 'www.polarisrealty.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name:     'title',                                   // “2680 Matheson Boulevard”
        selector: '#divImage .property p',
        type:     'text'
      },
      {
        name:     'breadcrumb_address',                      // breadcrumb current (also property name)
        selector: '#dlBreadcrumb a.current',
        type:     'text'
      },
      {
        name:     'leasing_contact_email',                   // obfuscated link
        selector: 'dl.left a[href^="mailto:"]',
        type:     'text'
      },
      {
        name:     'contact_phone',
        selector: 'dl.left dt:contains("P")',
        type:     'text'
      },

      // ——— Vacancy data placeholder ———
      // Each <h2 class="content"> section heading acts as one container row so we grab
      // the building facts even though no suite list exists.
      {
        name:     'vacancy_data',
        selector: '#divContent h2.content',
        type:     'container',
        childSelectors: [
          {
            name:  'suite_number',           // always empty (no suites on page)
            selector: 'span.suite-number-not-present',
            type:   'text'
          },
          {
            name:  'section_title',          // e.g., “Architecture/Engineering/Construction”
            selector: 'self',                // extract heading text
            type:   'text'
          },
          {
            name:  'section_details',        // bullet list following each heading
            selector: 'div + div',           // sibling div immediately after the h2
            type:   'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedPolarisSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'www.polarisrealty.com' });
    console.log('Cleared existing www.polarisrealty.com selectors');

    const saved = await Selectors.insertMany(polarisSelectors);
    console.log('www.polarisrealty.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding www.polarisrealty.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedPolarisSelectors();
