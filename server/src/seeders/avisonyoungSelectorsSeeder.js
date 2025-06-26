/**
 * Seed CSS selectors for Avison Young – “New Availability” cards
 *
 * Container :  .availability-card-v2                              (the whole card)
 * Children  :
 *    • space_type  –  ".availability-card-info-item:contains('Space Type')  .availability-card-info-item-value"
 *    • unit_suite  –  ".availability-card-info-item:contains('Unit/Suite')  .availability-card-info-item-value"
 *    • total_size  –  ".availability-card-info-item:contains('Total Size')  .availability-card-info-item-value"
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const avisonyoungSelectors = [
  {
    domain: 'avisonyoung.ca',
    selectors: [
      {
        name: 'vacancy_data',
        selector: '.availability-card-v2',       // container  (one card per availability)
        type: 'container',
        childSelectors: [
          {
            name: 'space_type',
            selector:
              ".availability-card-info-item:contains('Space Type') .availability-card-info-item-value",
            type: 'text',
          },
          {
            name: 'unit_suite',
            selector:
              ".availability-card-info-item:contains('Unit/Suite') .availability-card-info-item-value",
            type: 'text',
          },
          {
            name: 'total_size',
            selector:
              ".availability-card-info-item:contains('Total Size') .availability-card-info-item-value",
            type: 'text',
          },
        ],
      },
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date(),
  },
];

const seedAvisonYoungSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
    console.log('MongoDB connected');

    // clear old selectors for this domain
    await Selectors.deleteMany({ domain: 'avisonyoung.ca' });
    console.log('Cleared existing avisonyoung.ca selectors');

    // insert new
    const saved = await Selectors.insertMany(avisonyoungSelectors);
    console.log('avisonyoung.ca selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding avisonyoung.ca selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// run
seedAvisonYoungSelectors();
