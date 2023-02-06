// Import the 'dotenv' package to access environment variables
// stored in the '.env' file
require('dotenv').config();

// Import the '@line/bot-sdk' library for using the LINE Bot API
const line = require('@line/bot-sdk');

// Import the 'express' library for creating a web server
const express = require('express');

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
function handleEvent(event) {
  // If the event is not a message event or the message is not a text message,
  // ignore the event
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // Create a text message to echo back the received message text
  const echo = { type: 'text', text: event.message.text };

  // Use the reply API to send the echo message back to the user
  return client.replyMessage(event.replyToken, echo);
}

// Start the Express app and listen on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
