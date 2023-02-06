const express = require('express');
const line = require('@line/bot-sdk');
const openai = require('openai');

const app = express();

const port = process.env.PORT || 5000;

const config = {
  channelAccessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
  channelSecret: 'YOUR_CHANNEL_SECRET'
};

openai.promisified = true;

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const message = event.message.text;
  
  if (message === 'hey sk') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Hello! How can I help you today?'
    });
  } else if (message === 'show me') {
    const response = await openai.ImageCompletion.create(model, prompt, n=1, temperature=0.5, maxTokens=1024);
    const imageUrl = response.data[0].url;
    return client.replyMessage(event.replyToken, {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    });
  } else {
    return Promise.resolve(null);
  }
}

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
