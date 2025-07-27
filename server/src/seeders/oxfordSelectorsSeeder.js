/**
 * Seed file – selectors for oxfordproperties.com (example page: WaterPark Place – 20 Bay Street)
 * run:  node seedOxford20Bay.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const oxfordSelectors = [
  {
    domain: 'www.oxfordproperties.com',
    selectors: [
      // ——— Page‑level selectors ———
      {
        name:     'title',                                   // “WaterPark Place”
        selector: 'div.single-property h1',
        type:     'text'
      },
      {
        name:     'address',                                 // “20 Bay Street, Toronto, ON  M5J 2N8”
        selector: 'div.marker-in-focus-false p',
        type:     'text'
      },

      // ——— Vacancy data ———
      // Each available suite row is a responsive grid with these tailwind classes.
      {
        name:     'vacancy_data',
        selector: "div.lg\\:grid.lg\\:grid-cols-6.border-t.border-light-blue.py-4",
        type:     'container',
        childSelectors: [
          {
            name:  'suite_number',                           // “Suite 300” → returns full string
            selector: 'div.py-2:nth-child(1)',
            type:   'text'
          },
          {
            name:  'suite_size',                             // “21,998 sq ft”
            selector: 'div.py-2:nth-child(2)',
            type:   'text'
          },
          {
            name:  'availability_date',                      // “Available Immediately”
            selector: 'div.py-2:nth-child(3)',
            type:   'text'
          },
          {
            name:  'suite_notes',                            // marketing comments (may be blank)
            selector: 'div.py-2:nth-child(4)',
            type:   'text'
          },
          {
            name:  'additional_link',                        // e.g., “See floor plan” link
            selector: 'a[href$=".pdf"]',
            type:   'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',    // update with real checksum when seeding
    lastChecked:  new Date()
  }
];

const seedOxfordSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove existing Oxford selectors
    await Selectors.deleteMany({ domain: 'www.oxfordproperties.com' });
    console.log('Cleared existing www.oxfordproperties.com selectors');

    // insert the new ones
    const saved = await Selectors.insertMany(oxfordSelectors);
    console.log('www.oxfordproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding www.oxfordproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedOxfordSelectors();
