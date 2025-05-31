const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('../models/Selectors');

const amazonSelectors = [
    {
        domain: 'amazon.ca',
        selectors: [
            {
                target_elemnt: 'title',
                selector_value: '#productTitle'
            },
            {
                target_elemnt: 'price',
                selector_value: '#corePrice_feature_div .a-offscreen, span#priceblock_ourprice, span#priceblock_dealprice, span.a-price span.a-offscreen'
            },
            {
                target_elemnt: 'rating',
                selector_value: 'span[data-hook="rating-out-of-text"], i.a-icon-star span.a-icon-alt'
            },
            {
                target_elemnt: 'reviews_count',
                selector_value: '#acrCustomerReviewText'
            },
            {
                target_elemnt: 'availability',
                selector_value: '#availability span'
            },
            {
                target_elemnt: 'main_image',
                selector_value: '#imgTagWrapperId img#landingImage'
            },
            {
                target_elemnt: 'bullet_points',
                selector_value: '#feature-bullets ul li span'
            },
            {
                target_elemnt: 'description',
                selector_value: '#productDescription p, div#productDescription'
            },
            {
                target_elemnt: 'brand',
                selector_value: '#bylineInfo'
            },
            {
                target_elemnt: 'asin',
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