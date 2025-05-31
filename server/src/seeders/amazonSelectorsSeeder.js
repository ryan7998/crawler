const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

const amazonSelectors = [
    {
        domain: 'amazon.ca',
        selectors: [
            {
                target_element: 'title',
                selector_value: '#productTitle'
            },
            {
                target_element: 'price',
                selector_value: '#corePrice_feature_div .a-offscreen, span#priceblock_ourprice, span#priceblock_dealprice, span.a-price span.a-offscreen'
            },
            {
                target_element: 'rating',
                selector_value: 'span[data-hook="rating-out-of-text"], i.a-icon-star span.a-icon-alt'
            },
            {
                target_element: 'reviews_count',
                selector_value: '#acrCustomerReviewText'
            },
            {
                target_element: 'availability',
                selector_value: '#availability span'
            },
            {
                target_element: 'main_image',
                selector_value: '#imgTagWrapperId img#landingImage'
            },
            {
                target_element: 'bullet_points',
                selector_value: '#feature-bullets ul li span'
            },
            {
                target_element: 'description',
                selector_value: '#productDescription p, div#productDescription'
            },
            {
                target_element: 'brand',
                selector_value: '#bylineInfo'
            },
            {
                target_element: 'asin',
                selector_value: 'input#ASIN'
            }
        ],
        htmlChecksum: 'test-checksum',
        lastChecked: new Date()
    }
];

const seedAmazonSelectors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Clear existing selectors for amazon.ca
        await Selectors.deleteMany({ domain: 'amazon.ca' });
        console.log('Cleared existing Amazon.ca selectors');

        // Insert new selectors
        const savedSelectors = await Selectors.insertMany(amazonSelectors);
        console.log('Amazon.ca selectors seeded:', savedSelectors);

    } catch (error) {
        console.error('Error seeding Amazon.ca selectors:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Run the seeder
seedAmazonSelectors(); 