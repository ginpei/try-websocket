const { readFileSync } = require('fs');
const path = require('path');
const express = require('express');
const expressWs = require('express-ws');
const { handleChatRoom } = require('./server/models/chat');

/**
 * @type {import('express').Express & {
 *   ws: (path: string, handler: import('express-ws').WebsocketRequestHandler) => void
 * }}
 */
const app = (express());
const appWs = expressWs(app);

app.use(express.static('public'));

app.get('/chat/:id', (req, res) => {
  const view = readFileSync(path.join(__dirname, './server/views/chat-view.html'), 'utf8');
  res.send(view);
});

app.ws('/echo', (ws, req) => {
  // console.log('# connected', req);
  ws.on('message', (msg) => {
    // console.log('# message', req);
    ws.send(msg);
  });
});

app.ws('/chat/:id', (ws, req) => {
  const { id } = req.params;
  handleChatRoom(ws, id);
});

// eslint-disable-next-line no-console
app.listen(3000, () => console.log('# ready'));
