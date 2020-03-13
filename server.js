const express = require('express');
const expressWs = require('express-ws');

/**
 * @type {import('express').Express & {
 *   ws: (path: string, handler: import('express-ws').WebsocketRequestHandler) => void
 * }}
 */
const app = (express());
const appWs = expressWs(app);

app.use(express.static('static'));


app.ws('/echo', (ws, req) => {
  console.log('# connected', req);
  ws.on('message', (msg) => {
    console.log('# message', req);
    ws.send(msg);
  });
});

app.listen(3000, () => console.log('# ready'));
