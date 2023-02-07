require('dotenv').config();

const line = require('@line/bot-sdk');
const express = require('express');
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
    return Promise.resolve(null);
  }

  if (event.message.text.startsWith("show me")) {
    // Use OpenAI Image API to generate an image
    const image = await openai.createImage({
      model: "image-alpha-001",
      prompt: event.message.text.substring(7)
    });

    // Reply with the generated image
    return client.replyMessage(event.replyToken, {
      type: 'image',
      originalContentUrl: image.data.url,
      previewImageUrl: image.data.url
    });
  } else {
    // Use OpenAI Text API to generate a response
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: event.message.text ,
      max_tokens: 500,
    });

    // Reply with the generated response
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: completion.data.choices[0].text.trim()
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
