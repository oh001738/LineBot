require('dotenv').config();
const axios = require('axios');
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

  if (event.message.text.startsWith("show me ")) {
    const description = event.message.text.slice(8);
    try {
      const completion = await openai.createCompletion({
        model: "image-alpha-001",
        prompt: `Complete the following prompt: show me ${description}`,
        max_tokens: 50,
      });
  
      const imageURL = completion.data.choices[0].text.trim();
      
      // 透過 Axios 將圖片下載下來
      const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
      const image = Buffer.from(response.data, 'binary').toString('base64');
  
      // 將圖片傳送到 LINE 使用者
      const message = {
        to: event.source.userId,
        messages: [
          {
            type: 'image',
            originalContentUrl: `data:image/jpeg;base64,${image}`,
            previewImageUrl: `data:image/jpeg;base64,${image}`
          }
        ]
      };
      const accessToken = process.env.CHANNEL_ACCESS_TOKEN;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };
      const result = await axios.post('https://api.line.me/v2/bot/message/push', message, { headers });
  
      console.log(result.data);
    } catch (error) {
      console.error(error);
    }

  }

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text ,
    max_tokens: 500,
  });
  // create a response text message
  const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
