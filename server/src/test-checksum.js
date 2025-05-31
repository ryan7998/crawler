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
    
    try {
        // Find or create a selector for example.com
        let selector = await Selectors.findOne({ domain: 'example.com' });
        if (!selector) {
            selector = new Selectors({
                domain: 'example.com',
                selectors: [
                    {
                        target_elemnt: 'title',
                        selector_value: 'h1'
                    }
                ]
            });
        }

        // Example HTML content
        const originalHtml = '<html><body><h1>Hello World</h1></body></html>';
        const modifiedHtml = '<html><body><h1>Hello World Updated</h1></body></html>';

        // First check with original HTML
        console.log('Checking original HTML...');
        const hasChanged = selector.hasHtmlChanged(originalHtml);
        console.log('HTML changed:', hasChanged);

        // Update checksum with original HTML
        await selector.updateHtmlChecksum(originalHtml);
        console.log('Updated checksum:', selector.htmlChecksum);

        // Check with modified HTML
        console.log('\nChecking modified HTML...');
        const hasChangedAgain = selector.hasHtmlChanged(modifiedHtml);
        console.log('HTML changed:', hasChangedAgain);

        // Update checksum with modified HTML
        await selector.updateHtmlChecksum(modifiedHtml);
        console.log('Updated checksum:', selector.htmlChecksum);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        mongoose.connection.close();
    }
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
}); 