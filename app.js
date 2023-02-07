// Import the 'dotenv' package to access environment variables
// stored in the '.env' file
require('dotenv').config();

// Import the '@line/bot-sdk' library for using the LINE Bot API
const line = require('@line/bot-sdk');

// Import the 'express' library for creating a web server
const express = require('express');

// Import the 'openai' library for query openai data
const { Configuration, OpenAIApi } = require("openai");
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
app.post('/callback', line.middleware(config), (req, res) => {
  // Use 'Promise.all()' to handle all events in the webhook request body
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Event handler function to process incoming events
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  let echo;
  if (event.message.text.startsWith("hey sk ")) {
    const prompt = event.message.text.replace("hey sk ", "");
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 200,
    });
    echo = { type: 'text', text: completion.data.choices[0].text.trim() };
  } else if (event.message.text.startsWith("show me ")) {
   // const prompt = event.message.text.replace("show me ", "");
    //const imageCompletion = await openai.createImage({
      //model: "image-alpha-001",
      //prompt: "A cute baby sea otter",
      //n: 1,
      //size: "256x256",
      //response_format: "url"
    //});
    //const imageUrl = imageCompletion.data.images[0].url;
    //console.log(imageCompletion.data.data[0].url);
    imageUrl = "https://www.esunbank.com.tw/bank/-/media/New-ESUNBANK/Home/HugeBanner/FHC/drawesun_800_500.jpg?h=500&w=800&hash=3EB0A2D6452F6A5F9BEDB0D90381D2D0";
    echo = {
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    };
  } else {
    // input message doesn't match "hey sk " or "show me "
    return Promise.resolve(null);
  }

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}


// Start the Express app and listen on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});