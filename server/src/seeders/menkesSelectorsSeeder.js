/**
 * Seed file - floorplan selectors for menkes.com
 * run:  node seedMenkesFloorplans.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const Selectors = require('../models/Selectors');

const menkesFloorplansSelectors = [
  {
    domain: 'www.menkes.com',
    selectors: [
      // ——— Page-level selectors ———
      {
        name: 'title',
        selector: 'div.project-header h1',
        type: 'text'
      },

      // ——— Floorplan container ———
      {
        name: 'vacancy_data',
        selector: 'div.project-floorplans__item',
        type: 'container',
        childSelectors: [
          {
            name: 'floor_label',
            selector: 'a',
            type: 'text'
          },
          {
            name: 'plans_link',
            selector: 'a',
            type: 'link',
            attribute: 'href'
          }
        ]
      }
    ],
    htmlChecksum: 'test-checksum',
    lastChecked: new Date()
  }
];

const seedMenkesFloorplans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    await Selectors.deleteMany({ domain: 'www.menkes.com' });
    console.log('Cleared existing www.menkes.com selectors');

    const saved = await Selectors.insertMany(menkesFloorplansSelectors);
    console.log('www.menkes.com floorplan selectors seeded:', saved);
  } catch (err) {
    console.error('Error seeding www.menkes.com floorplan selectors:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedMenkesFloorplans();
