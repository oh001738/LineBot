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
  apiKey: process.env[selectedApiKey],
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

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text ,
    max_tokens: 200,
  });

  // create a echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// Start the Express app and listen on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
