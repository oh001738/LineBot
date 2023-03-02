// Import the 'dotenv' package to access environment variables
// stored in the '.env' file
require('dotenv').config();

// Import the '@line/bot-sdk' library for using the LINE Bot API
const line = require('@line/bot-sdk');
const {
    text
} = require('express');

// Import the 'express' library for creating a web server
const express = require('express');

// Import the 'openai' library for query openai data
const {
    Configuration,
    OpenAIApi
} = require("openai");
const apiKeys = [
    process.env.OPENAI_API_KEY1,
    process.env.OPENAI_API_KEY2
];
const selectedApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
console.log("Using API Key:", selectedApiKey);

const configuration = new Configuration({
    apiKey: selectedApiKey,
});
const openai = new OpenAIApi(configuration);

// Create a configuration object for the LINE Bot API using environment variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// Create a client for the LINE Bot API using the configuration object
const client = new line.Client(config);

// Create an instance of the Express app
const app = express();

// Register a handler for receiving webhook events from the LINE platform
app.post('/callback', line.middleware(config), async (req, res) => {
    try {
        const result = await Promise.all(req.body.events.map(handleEvent));
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

// Event handler function to process incoming events
async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }
    let echo;
    const textCallSign = process.env.TEXT_CALL_SIGN;
    const textCallSignLength = textCallSign.length;
    const imageCallSign = process.env.IMAGE_CALL_SIGN;
    const imageCallSignLength = imageCallSign.length;

    const inputText = event.message.text.toLowerCase();
    if (inputText === textCallSign) {
        echo = {
            type: 'text',
            text: '我叫'+textCallSign+'你有什麼事情嗎?'
        };
    } else if (inputText.startsWith(imageCallSign)) {
        const completion = await openai.createImage({
            prompt: event.message.text.substring(imageCallSignLength),
            n: 1,
            size: "256x256",
        });
        image_url = completion.data.data[0].url;
        // create a echoing text message
        echo = {

            type: 'image',
            originalContentUrl: image_url,
            previewImageUrl: image_url
        };
    } else if (inputText.startsWith(textCallSign)) {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: event.message.text.substring(textCallSignLength),
            temperature: 0.4,
            max_tokens: 200,
        });
        echo = {
            type: 'text',
            text: completion.data.choices[0].text.trim()
        };
    } else {
        return Promise.resolve(null);
    }
    // use reply API
    return client.replyMessage(event.replyToken, echo);
}
app.use('/healthcheck', require('./routes/healthcheck'));
// Start the Express app and listen on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
