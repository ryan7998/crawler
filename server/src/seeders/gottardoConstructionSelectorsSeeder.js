/**
 * Seed file: seeds/gottardoConstructionSelectors.js
 *
 * 2315 Bristol Circle – Gottardo Construction
 * URL pattern: http(s)://gottardoconstruction.gottardogroup.com/*.php
 */
const mongoose   = require('mongoose');
require('dotenv').config();
const Selectors  = require('../models/Selectors');

const gottardoSelectors = [
    {
      domain: 'gottardoconstruction.gottardogroup.com',
      selectors: [
        {
          name: 'listing_title',
          selector: 'span.titles',
          type: 'text'
        },
        {
          name: 'available_unit',
          selector: 'p.body > b',   // “NOW AVAILABLE …” line
          type: 'text'
        },
        {
          name: 'rent_bullet',
          selector: 'ul li span.body:contains("$")',
          type: 'text'
        }
      ],
      htmlChecksum: 'test-checksum',
      lastChecked : new Date()
    }
  ];
  

const seedGottardoSelectors = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected');

    // Clear existing selectors for this domain
    await Selectors.deleteMany({ domain: 'gottardoconstruction.gottardogroup.com' });
    console.log('Cleared existing selectors for gottardoconstruction.gottardogroup.com');

    // Insert the new ones
    const saved = await Selectors.insertMany(gottardoSelectors);
    console.log('Seeded selectors:', saved);
  } catch (err) {
    console.error('Error seeding selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeder
seedGottardoSelectors();
