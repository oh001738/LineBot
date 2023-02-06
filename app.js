require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
const app = express();

// register a webhook handler with middleware
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  if (event.message.text.startsWith("show me")) {
    const completion = await openai.createImageCompletion({
      model: "image-alpha-001",
      prompt: event.message.text.substring(8),
      n: 1,
    });

    // create a image message
    const image = {
      type: 'image',
      originalContentUrl: completion.data.choices[0].image,
      previewImageUrl: completion.data.choices[0].image,
    };

    // use reply API
    return client.replyMessage(event.replyToken, image);
  }

  if (!event.message.text.startsWith("hey sk")) {
    const response = { type: 'text', text: "請輸入 hey sk +問題 來找到我！" };
    return client.replyMessage(event.replyToken, response);
  }

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text.substring(7),
    max_tokens: 500,
  });

  // create a echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
