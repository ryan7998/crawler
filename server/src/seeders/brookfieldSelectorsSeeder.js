require('dotenv').config();
const mongoose = require('mongoose');
const Selectors = require('../models/Selectors');

const brookfieldSelectors = [
  {
    domain: 'brookfieldproperties.com',
    selectors: [
      {
        name: 'availability_row',
        selector: 'div.b-property-details__vts-grid',
        type: 'container',
        childSelectors: [
          {
            name: 'floor',
            selector: 'div.b-property-details__vts-grid-item-floor span',
            type: 'text',
          },
          {
            name: 'suite_type',
            selector: 'div.b-property-details__vts-grid-item-suite-type span',
            type: 'text',
          },
          {
            name: 'area_sf',
            selector: 'div.b-property-details__vts-grid-item-magnitude span',
            type: 'text',
          },
          {
            name: 'condition',
            selector: 'div.b-property-details__vts-grid-item-condition span',
            type: 'text',
          },
          {
            name: 'availability',
            selector: 'div.b-property-details__vts-grid-item-availability span',
            type: 'text',
          },
          {
            name: 'learn_more_link',
            selector: 'div.b-property-details__vts-grid-item-learnmore a',
            type: 'link',
            attribute: 'href',
          },
        ],
      },
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date(),
  },
];

const seedBrookfieldSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'brookfieldproperties.com' });
    console.log('Cleared existing brookfieldproperties.com selectors');

    const saved = await Selectors.insertMany(brookfieldSelectors);
    console.log('brookfieldproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding brookfieldproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedBrookfieldSelectors();
