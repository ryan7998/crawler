const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

/**
 *  QuadReal / findspace – Commerce Court West
 *  Each row = one suite
 */
const quadrealSelectors = [
  {
    domain: 'quadreal.findspace.com',
    selectors: [
      {
        /* --- ROW / CONTAINER ------------------------------------------------ */
        name: 'vacancy_data',
        selector: 'div.SuiteListItem_suiteInfoContainer__NTfk0',
        type: 'container',

        /* --- CHILD SELECTORS (relative to the row) -------------------------- */
        childSelectors: [
          {
            name: 'suite_number',
            selector: '.SuiteListItem_suiteNameAndTag__FBNmQ',
            type: 'text',
          },
          {
            name: 'size',
            selector: '.SuiteListItem_suiteArea__qcP0_',
            type: 'text',
          },
          {
            name: 'availability',
            selector: '.SuiteListItem_availabilityDate__Ak_yK',
            type: 'text',
          },
          {
            name: 'base_rent',
            selector: 'button.SuiteListItem_inquiryBtn__ZBdtK',
            type: 'text', // “Inquire” when price hidden
          },
          {
            name: 'additional_rent',
            selector: 'div.SuiteListItem_additionalRent__n7Yqv',
            type: 'text',
          },
        ],
      },
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date(),
  },
];

const seedQuadrealSelectors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
    console.log('MongoDB connected');

    // Clear existing selectors for this domain
    await Selectors.deleteMany({ domain: 'quadreal.findspace.com' });
    console.log('Cleared existing quadreal.findspace.com selectors');

    // Insert new selectors
    const savedSelectors = await Selectors.insertMany(quadrealSelectors);
    console.log('quadreal.findspace.com selectors seeded:', savedSelectors);
  } catch (error) {
    console.error('Error seeding quadreal.findspace.com selectors:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeder
seedQuadrealSelectors();
