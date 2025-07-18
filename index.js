const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const axios = require('axios');

app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

function handleMessage(sender_psid, received_message) {
  const response = {
    text: `Ви написали: ${received_message.text}`
  };
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, postback) {
  const response = { text: `Ви натиснули: ${postback.payload}` };
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`, {
    recipient: { id: sender_psid },
    message: response
  }).catch(error => {
    console.error('Send API error:', error.response?.data || error.message);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook is listening on port ${PORT}`));
