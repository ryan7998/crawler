require('dotenv').config();
const fs = require('fs');
const path = require('path');
// import { InferenceClient } from "@huggingface/inference";
const { InferenceClient } = require("@huggingface/inference");
const client = new InferenceClient(process.env.HUGGINGFACEHUB_API_TOKEN);

(async () => {
    const url = 'https://www.walmart.ca/en/ip/Gymax-4PCS-Rattan-Patio-Conversation-Furniture-Set-Outdoor-Sectional-Sofa-Set/4F5OYTFXIW2W?athcpid=4F5OYTFXIW2W&athpgid=AthenaGlassHomePageDesktopV1&athcgid=null&athznid=f0356e97-3d2c-4f2c-bce3-dd3fc45f159b&athieid=v0&athstid=CS020&athguid=k2834VSL9nwV7-5zfOf7SeoXzd_crAKe86yV&athancid=null&athena=true&athbdg=L1700'
    
    const imagePath = path.join(__dirname, 'source-code_6_Amz.png');
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert the file to a base64 encoded string and create a data URI
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;

    // const chatCompletion = await client.textGeneration({
    const chatCompletion = await client.chatCompletion({
        provider: "hf-inference",
        // model: "meta-llama/Llama-3.3-70B-Instruct",
        model: "google/gemma-3-27b-it", // multimodal, handling text and image input
        // model: "Qwen/Qwen2.5-VL-7B-Instruct",
        messages: [
            {
                role: "user",
                // content: `can you find all the important attributes like image, price, name, etc and unique selector for this string: ${htmlStr}. If so please return in json format. thanks. If you cannot please return false`,
                // content: `can you find all the important attributes name and unique selector for this website: ${url}. If so please return in json format. thanks. If you cannot please return false`,
                content: [
                    {
                        type: "text",
                        // text: "Describe this image in one sentence.",
                        text: "can you extract all the important attributes like images, price, title, etc from this image. return in json format. if you cannot return false.",
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: dataUri,
                        },
                    },
                ],
            },

        ],
        
        max_tokens: 5000,
    });
    
    console.log(chatCompletion.choices[0].message);
})()