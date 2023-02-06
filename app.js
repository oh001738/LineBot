const express = require("express");
const line = require("@line/bot-sdk");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
const client = new line.Client(config);

const app = express();

app.post("/callback", line.middleware(config), async (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  if (event.message.text.startsWith("show me")) {
    const response = await openai.createImage({
      prompt: event.message.text.substring(7)
    });

    const imageUrl = response.data.url;
    const echo = {
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    };
    return client.replyMessage(event.replyToken, echo);
  } else if (event.message.text.startsWith("hey sk")) {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: event.message.text.substring(7),
      max_tokens: 500
    });

    const echo = { type: "text", text: completion.data.choices[0].text.trim() };
    return client.replyMessage(event.replyToken, echo);
  } else {
    const response = {
      type: "text",
      text: "你是不是要找SK？請輸入 hey sk +問題 來找到我！或輸入 show me +描述 來獲得圖片。"
    };
    return client.replyMessage(event.replyToken, response);
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
