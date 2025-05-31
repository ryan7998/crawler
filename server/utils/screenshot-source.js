const { chromium } = require('playwright');
const { vl } = require('moondream');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

(async () => {

    const model = new vl({
        apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiI3M2ExZWE4ZC1hYzcyLTQ5OWMtODg0NC1kZDM2Mjg3NjE0ZWMiLCJpYXQiOjE3NDI1MzU0NDB9.L-o-zF6qQgHPUk10Y8SUKthGjBREw41suBy6O2rLNYA"
    });

    // Launch the browser
    const browser = await chromium.launch();

    // Create a new page to fetch the webpage source code
    const page = await browser.newPage();

    // Navigate to the target webpage
    await page.goto('https://www.amazon.ca/PS5-Console-Astro-Bot-Bundle/dp/B0DWGM3F5Q?pd_rd_w=pch9c&content-id=amzn1.sym.e0b5b8df-c7a3-4462-b3fb-639731524e88&pf_rd_p=e0b5b8df-c7a3-4462-b3fb-639731524e88&pf_rd_r=3S60Q8F3PQ7Z7BZYS9T4&pd_rd_wg=16Wum&pd_rd_r=1320371b-23f9-46a2-a785-ad1417f82182&pd_rd_i=B0DWGM3F5Q&ref_=pd_hp_d_btf_unk_B0DWGM3F5Q');
      // await page.goto('https://www.walmart.ca/en/ip/Gymax-3PCS-Patio-Rattan-Sofa-Set-Outdoor-Wicker-Conversation-Set-Glass-Tabletop-w-Grey-Cushion/1B6FHOWUDQL7?athcpid=1B6FHOWUDQL7&athpgid=AthenaGlassHomePageDesktopV1&athcgid=null&athznid=f0356e97-3d2c-4f2c-bce3-dd3fc45f159b&athieid=v0&athstid=CS020&athguid=iqxpQ1XEIOk_c8E9x_cbtFfgVyTzQXFKieYM&athancid=null&athena=true&athbdg=L1700');
   // Take a screenshot of the page that shows the source code
    const screenshotPath = path.join(__dirname, 'source-code_6_Amz.png');
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 60000 });
    

    
    // // Get the HTML source code as text
    // const sourceCode = await page.content();

    // // Load HTML from a string:
    // const $ = cheerio.load(sourceCode)

    // // Remove <script> and <style> elements
    // $('[style]').removeAttr('style');
    // $('[onload], [onclick], [onmouseover], [onmouseout]').removeAttr('onload onclick onmouseover onmouseout');
    // $('script, style').remove();
    
    // // Normalize Whitespace in Text Nodes:
    // $('*').each(function() {
    //   $(this).contents().filter(function() {
    //     return this.type === 'text';
    //   }).each(function() {
    //     this.data = this.data.replace(/\s+/g, ' ').trim();
    //   });
    // });
    // // Get the cleaned HTML
    // const cleanedHtml = $.html();

    // // Create a new page to render the source code in a <pre> block
    // const codePage = await browser.newPage();

    // You can define some basic CSS for formatting (optional)
    // const htmlContent = `
    // <html>
    //     <head>
    //     <style>
    //         body {
    //         margin: 20px;
    //         background: #2e3440;
    //         color: #d8dee9;
    //         font-family: monospace;
    //         font-size: 14px;
    //         }
    //         pre {
    //         white-space: pre-wrap;
    //         word-wrap: break-word;
    //         background: #3b4252;
    //         padding: 20px;
    //         border-radius: 4px;
    //         }
    //     </style>
    //     </head>
    //     <body>
    //     <pre>${escapeHtml(cleanedHtml)}</pre>
    //     </body>
    // </html>
    // `;

    // Set the content of the new page to our formatted HTML source code
    // await codePage.setContent(htmlContent);
    // fs.writeFileSync('screenshot.html', htmlContent);
    // Take a screenshot of the page that shows the source code
    // const screenshotPath = path.join(__dirname, 'source-code_3.png');
    // await codePage.screenshot({ path: screenshotPath, fullPage: true, timeout: 60000 });
    // console.log('Screenshot saved at:', screenshotPath);
    await browser.close();
    
    
    // await codePage.setViewportSize({ width: 1280, height: 720 });
    // await codePage.waitForTimeout(5000); // Wait for content to fully render
    // const buffer = await codePage.screenshot({ type: 'jpeg', quality: 80, fullPage: true, timeout: 60000 });
    // console.log('Buffer length:', buffer.length);
    // fs.writeFileSync('screenshot.jpeg', buffer);
    // await codePage.screenshot({ path: screenshotPath, type:'jpeg', quality: 80, fullPage: true, timeout: 60000 });
    // const buffer = await codePage.screenshot({ path: screenshotPath, fullPage: true, timeout: 60000 });
    // sharp(buffer)
    //     .jpeg({ quality: 80 })
    //     .toFile('source-code.jpeg')
    //     .then(() => console.log('JPEG screenshot saved successfully.'))
    //     .catch(err => console.error('Error converting to JPEG:', err));
    


    //   MoonDream ai tasks:

    // Load an image
    // try{
    //     const screenshotPath = path.join(__dirname, 'source-code_5.png');
    //     const encodedImage = Buffer.from(fs.readFileSync(screenshotPath))  // Load and encode image
    //     // const encodedImage = Buffer.from(fs.readFileSync("source-code.jpeg"))  // Load and encode image
    //     console.log('Image encoded')
    
    //     // Generate caption (length options: "short" or "normal" (default))
    //     const caption = await model.caption({ image: encodedImage })
    //     console.log("Caption:", caption)

    //     // Stream the caption
    //     process.stdout.write("Streaming caption: ")
    //     const captionStream = await model.caption({ image: encodedImage, stream: true })
    //     for await (const chunk of captionStream.caption) process.stdout.write(chunk)
        
    //     // Ask questions about the image
    //     const answer = await model.query({ image: encodedImage, question: "what is the price in this image?" })
    //     console.log("\nAnswer:", answer)
    // } catch( err){
    //     console.log('error: ', err)
    // } 
})();

// Helper function to escape HTML so that it renders as text
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (match) {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
    }
  });
}