const mongoose = require('mongoose');
require('dotenv').config();
const Selectors = require('./models/Selectors');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('MongoDB connected');
    
    // Create a test selector document
    const testSelector = new Selectors({
        domain: 'amazon.com',
        selectors: [
            {
                target_elemnt: 'title',
                selector_value: '#productTitle'
            },
            {
                target_elemnt: 'price',
                selector_value: '#priceblock_ourprice'
            },
            {
                target_elemnt: 'description',
                selector_value: '#productDescription'
            }
        ],
        htmlChecksum: 'test-checksum',
        lastChecked: new Date()
    });

    try {
        const savedSelector = await testSelector.save();
        console.log('Test selector saved:', savedSelector);
    } catch (error) {
        console.error('Error saving test selector:', error);
    } finally {
        // Close the connection
        mongoose.connection.close();
    }
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
}); 