/**
 * Seed file – selectors for yorkheritage.com (3 Church Street)
 * run:  node seedYorkHeritage3Church.js
 *
 * York Heritage property pages are purely descriptive (no suite list).  We still
 * provide a `vacancy_data` container so the crawler has a consistent anchor
 * point.  Because no suites are shown, **no `suite_number` field is included**.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const yorkHeritageSelectors = [
  {
    domain: 'www.yorkheritage.com',
    selectors: [
      // ——— Page‑level selectors ———
      {
        name:     'title',                         // “3 Church Street”
        selector: 'h1.page-title span[data-content-field="title"], h1.page-title',
        type:     'text'
      },
      {
        name:     'address',                       // “3 Church Street  Toronto ON M5E 1A9” (LOCATION paragraph)
        selector: 'p:contains("LOCATION")',
        type:     'text'
      },

      // ——— Vacancy placeholder (no suites) ———
      {
        name:     'vacancy_data',
        selector: 'div.main-content',              // entire descriptive body
        type:     'container',
        childSelectors: [
          {
            name:  'property_description',         // first long description block (large <h2>)
            selector: 'div.sqs-block-html h2',
            type:   'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked:  new Date()
  }
];

const seedYorkHeritageSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'www.yorkheritage.com' });
    console.log('Cleared existing yorkheritage.com selectors');

    const saved = await Selectors.insertMany(yorkHeritageSelectors);
    console.log('yorkheritage.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding yorkheritage.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedYorkHeritageSelectors();
