/**
 * Fieldgate Properties – selector seed
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const fieldgateSelectors = [
  {
    domain: 'fieldgateproperties.com',
    selectors: [
      {
        name: 'property_info',
        selector: '.property-intro .col-sm-4',           // main right-hand column
        type: 'container',
        childSelectors: [
          { name: 'title',              selector: 'h4.title',                             type: 'text' },
          { name: 'address',            selector: 'h5.address',                           type: 'text' },
          { name: 'property_type',      selector: '.property-type',                       type: 'text' },
          { name: 'total_area',         selector: '.total-area',                          type: 'text' },
          { name: 'leasing_available',  selector: '.leasing',                             type: 'text' },
          { name: 'contact_name',       selector: '.leasing-available .name',             type: 'text' },
          { name: 'contact_phone',      selector: '.leasing-available .number',           type: 'text' },
          { name: 'contact_email',      selector: '.leasing-available .email a',          type: 'link', attribute: 'href' }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked : new Date()
  }
];

async function seedFieldgateSelectors () {
  try {
    // connect
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // wipe old
    await Selectors.deleteMany({ domain: 'fieldgateproperties.com' });
    console.log('Cleared existing fieldgateproperties.com selectors');

    // insert new
    const saved = await Selectors.insertMany(fieldgateSelectors);
    console.log('fieldgateproperties.com selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding fieldgateproperties.com selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedFieldgateSelectors();