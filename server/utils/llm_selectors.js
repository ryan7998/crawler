require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { InferenceClient } = require("@huggingface/inference");
const truncateHtml = require('truncate-html');
const { getCleanHtml } = require('./helperFunctions');
const { type } = require('os');



const client = new InferenceClient(process.env.HUGGINGFACEHUB_API_TOKEN);

(async () => {
    const loadHtml = async (url) => {
        try{
            console.log('inside loadHtml function')

            // Launch the browser
            const browser = await chromium.launch();
            // Create a new page to fetch the webpage source code
            const page = await browser.newPage();
            // Navigate to the target webpage
            await page.goto(url);
            // Take a screenshot of the page that shows the source code
            const screenshotPath = path.join(__dirname, 'selector-sc.png');
            await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 60000 });
            // Get the HTML content from the page
            const htmlContent = await page.content();
            // Remove script and css:
            const cleanHtmlContent = getCleanHtml(htmlContent)
            // // Save the HTML content to a file
            const htmlPath = path.join(__dirname, 'screenshot.html');
            fs.writeFileSync(htmlPath, htmlContent, 'utf8');
            
            await browser.close();
            return cleanHtmlContent;    

        }catch(err){
            console.log(err)
        }
    }

    // Simple approach: Slice the string into parts and "fix" each slice.
    function createHtmlChunks(html, size) {
        console.log('inside createHtmlChunks function')

        const chunks = [];
        let start = 0;
        while (start < html.length) {
            // Get a slice of the desired size
            let slice = html.slice(start, start + size);
            // Use truncateHtml to ensure valid HTML (it will add closing tags if needed)
            let safeChunk = truncateHtml(slice, slice.length, { ellipsis: '' });
            chunks.push(safeChunk);
            start += size;
        }
        return chunks;
    }

    const getChunkedUserQueryObj = (chunkedHtmlArr) => {
        const chunkedUserQueryObj = chunkedHtmlArr.map((chunk, index) => ({
            type: "text",
            text: index === 0
                ? `can you find all the important attributes name and unique selector for this html string. If so please return in json format. thanks. If you cannot please return false. The html string is divided into ${chunkedHtmlArr.length} chunks. Chunk 1: ${chunk}`
                : `Chunk ${index + 1}: ${chunk}`
        }))
        return chunkedUserQueryObj
    }

    const getQueryResponse = async (chunk, index, length, conversationStr) => {
        console.log(`inside getSelector function, index: ${index+1}/${length}`)
        try{
            const isLastChunk = (index + 1) === length;
            // Build a more specific prompt for the model
            // const prompt = index === 0 
            //     ? `Extract only the main product's css selectors from the following HTML snippet. 
            // Include attributes such as title, price, reviews, product details, and description. 
            // Do NOT include any information about related or similar products. 
            // The HTML is divided into ${length} chunks and will be sent in separate API requests. 
            // Please wait until you have received all chunks before generating your final response.
            // Chunk 1: "${chunk}"`
            //     : `This is chunk ${index + 1} of ${length} of the HTML snippet.

            // ${isLastChunk 
            //     ? `This is the last chunk. Please combine all chunks and return only the main product css selectors (title, price, reviews, product details, and description) in JSON format. Do not include any related or similar product data. Here is your reply combined from the previous chunks: ${conversationStr}`
            //     : 'Please wait for more chunks.'}`;

            const prompt_gemma = index === 0 
                ? `Extract only the main product's css selectors from the following HTML snippet. 
            Include attributes such as title, price, reviews, product details, and description. 
            Do NOT include any information about related or similar products. 
            The HTML is divided into ${length} chunks and will be sent in separate API requests. 
            Please wait until you have received all chunks before generating your final response.
            Chunk 1: "${chunk}"`
                : `This is chunk ${index + 1} of ${length} of the HTML snippet: '${chunk}'.

            ${isLastChunk 
                ? `This is the last chunk. Please combine all chunks and return only the main product css selectors (title, price, reviews, product details, and description) in JSON format. Do not include any related or similar product data. `
                // Here is your reply combined from the previous chunks: ${conversationStr}
                : 'Please wait for more chunks.'}`;
                // console.log('prompt: ', prompt_gemma) 
                // return
            const chatCompletion = await client.chatCompletion({
                provider: "hf-inference",
                model: "google/gemma-3-27b-it", // multimodal, handling text and image input
                // model: "meta-llama/Llama-3.3-70B-Instruct",
                messages: [
                    {
                        role: "user",
                        content:[
                            {
                                type: "text",
                                text: prompt_gemma,
                            },
                        ]
                        // content:  index === 0
                        //         ? `can you find all the important attributes name (e.g. title, price, reviews, product details, descriptions, etc) and unique css selectors and values for this html string. If so please return in json format. thanks. If you cannot please return false. The html string is divided into ${length} chunks and will be send in seperate api requests. So please do not reply until the last number of chunk i.e api request is sent. Chunk 1: "${chunk}"`
                        //         : `This is the Chunk ${index + 1} out of ${length} chunks: "${chunk}". This is ${index + 1 === length ? 'the' : 'not the'} last chunk. ${index + 1 === length ? ' Please combine the outcome of all the previous chunks and return in json format ' : 'to be continued..'}`
                    },
        
                ],
                
                max_tokens: 5000,
            });
            console.log(chatCompletion.choices[0].message);
            return chatCompletion.choices[0].message.content
        } catch(err){
            console.log(err)
            return {err}
        }
        
    }

    const cleanedHtml = await loadHtml('https://www.amazon.ca/PS5-Console-Astro-Bot-Bundle/dp/B0DWGM3F5Q?pd_rd_w=pch9c&content-id=amzn1.sym.e0b5b8df-c7a3-4462-b3fb-639731524e88&pf_rd_p=e0b5b8df-c7a3-4462-b3fb-639731524e88&pf_rd_r=3S60Q8F3PQ7Z7BZYS9T4&pd_rd_wg=16Wum&pd_rd_r=1320371b-23f9-46a2-a785-ad1417f82182&pd_rd_i=B0DWGM3F5Q&ref_=pd_hp_d_btf_unk_B0DWGM3F5Q')
    // const chunksize = 130000 
    const chunksize = 100000
    const chunkedHtmlArr = await createHtmlChunks(cleanedHtml, chunksize)
    const responses = []
    const length = chunkedHtmlArr.length
    for( let [index, chunk] of chunkedHtmlArr.entries()) {
        const response = await getQueryResponse(chunk, index, length, JSON.stringify(responses))
            if(response.err){
                console.log('Error caught: ', response.err)
                break;
            }
            responses.push(response)

    }
    // console.log(responses)
    // const chunkedUserQueryObj = getChunkedUserQueryObj(chunkedHtmlArr)
    // console.log('chunkedUserQueryObj: ', chunkedUserQueryObj)

    // const selectors = await getSelectors(chunkedUserQueryObj)
    // console.log(selectors)
})()