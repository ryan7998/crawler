/**
 * Seeder: selectors for 777 Bay Street (canderel.findspace.com)
 *
 * Captures each availability row (<div.SuiteListItem_suiteInfoContainer__NTfk0>)
 * and pulls the key data points that appear inside it.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Selectors = require('../models/Selectors');

const canderelSelectors = [
  {
    domain: 'canderel.findspace.com',
    selectors: [
      {
        /* one container = one suite row */
        name: 'vacancy_data',
        selector: 'div.SuiteListItem_suiteInfoContainer__NTfk0', // container
        type: 'container',
        childSelectors: [
          {
            name: 'suite_number',
            selector: '.SuiteListItem_suiteNameAndTag__FBNmQ',    // e.g. “4700”
            type: 'text',
          },
          {
            name: 'area_sf',
            selector: '.SuiteListItem_suiteArea__qcP0_',          // e.g. “13,245 sf”
            type: 'text',
          },
          {
            name: 'availability',
            selector: '.SuiteListItem_availabilityDate__Ak_yK',   // e.g. “Immediately”
            type: 'text',
          },
          {
            /* labelled “Additional Rent” on the page – effectively the $/sf rate */
            name: 'additional_rent',
            selector: '.SuiteListItem_additionalRent__n7Yqv',
            type: 'text',
          },
          {
            /* optional: brochure / plans link if present */
            name: 'plans_link',
            selector: '.DownloadButtons_downloadContainer__lbKUN a[href$=".pdf"]',
            type: 'link',
            attribute: 'href',
          },
        ],
      },
    ],
    htmlChecksum: 'initial-load',
    lastChecked: new Date(),
  },
];

async function seedCanderelSelectors() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // clear any previous entry for this domain
    await Selectors.deleteMany({ domain: 'canderel.findspace.com' });
    console.log('Existing selectors removed');

    // insert the new selector set
    const saved = await Selectors.insertMany(canderelSelectors);
    console.log('Seed complete:', saved);
  } catch (err) {
    console.error('Seeder error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedCanderelSelectors();
