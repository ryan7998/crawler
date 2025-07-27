/**
 * Seed file – selectors for cadillacfairview.com (example page: TD Bank Tower)
 * run:  node seedCadillacFairviewTDBank.js
 *
 * Notes
 * -----
 * • The page’s <section id="availability"> table lists each suite as its own
 *   <tr>.  We treat every row as one `vacancy_data` container so downstream
 *   processing gets a tidy array of suites.
 * • If a column is missing (e.g., no Suite Sheet link) the selector still
 *   returns an empty string, keeping the schema consistent.
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const cadillacFairviewSelectors = [
  {
    domain: 'www.cadillacfairview.com',
    selectors: [
      // ——— Page‑level selectors ———
      {
        name:     'title',                               // “TD Bank Tower”
        selector: 'h1.Text_type-h2__BunAW',
        type:     'text'
      },
      {
        name:     'address',                             // “66 Wellington St W. Toronto, ON …”
        selector: 'h2.Text_type-h4__jfywE',
        type:     'text'
      },

      // ——— Availability table ———
      {
        name:     'vacancy_data',
        selector: 'section#availability table tbody tr',  // each suite row
        type:     'container',
        childSelectors: [
          {
            name:  'suite_number',                       // col‑1 “4400”
            selector: 'td:nth-child(1)',
            type:   'text'
          },
          {
            name:  'total_space',                        // col‑2 “15,664”
            selector: 'td:nth-child(2)',
            type:   'text'
          },
          {
            name:  'available_date',                     // col‑3 “Immediately”
            selector: 'td:nth-child(3)',
            type:   'text'
          },
          {
            name:  'remarks',                            // col‑4 marketing notes
            selector: 'td:nth-child(4)',
            type:   'text'
          },
          {
            name:  'suite_sheet_link',                   // PDF / JPEG sheet (may be disabled)
            selector: 'td:nth-child(5) a[href$=".pdf"], td:nth-child(5) a[href$=".jpeg"], td:nth-child(5) a[href$=".jpg"], td:nth-child(5) a[href$=".png"]',
            type:   'text'
          },
          {
            name:  'virtual_tour_link',                  // 360 tour link (if enabled)
            selector: 'td:nth-child(6) a[href]',
            type:   'text'
          },
          {
            name:  'floor_plan_link',                    // floor plan link
            selector: 'td:nth-child(7) a[href$=".pdf"], td:nth-child(7) a[href$=".jpeg"], td:nth-child(7) a[href$=".jpg"], td:nth-child(7) a[href$=".png"]',
            type:   'text'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',    // update with real checksum when seeding
    lastChecked:  new Date()
  }
];

const seedCadillacFairviewSelectors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // remove existing selectors for this domain (TD Bank Tower property)
    await Selectors.deleteMany({ domain: 'www.cadillacfairview.com', 'selectors.name': 'vacancy_data', 'selectors.selector': { $regex: '#availability' } });
    console.log('Cleared existing cadillacfairview.com selectors for TD Bank Tower');

    // insert the new ones
    const saved = await Selectors.insertMany(cadillacFairviewSelectors);
    console.log('cadillacfairview.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding cadillacfairview.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedCadillacFairviewSelectors();
