/**
 * @typedef {import('ws')} WebSocket
 */

/**
 * @typedef {import('../types/chat').ChatUser & {
 *   ws: WebSocket,
 * }} ChatClient
 */

/**
 * @typedef {import('../types/chat').ChatRoom<ChatClient>} ChatRoom
 */

/** @type {Map<string, ChatRoom>} */
const chatRoom = new Map();

/**
 * @param {string} id
 * @returns {ChatRoom}
 */
function getChatRoom(id) {
  if (!chatRoom.has(id)) {
    chatRoom.set(id, { id, users: [] });
  }

  /** @type {ChatRoom} */
  const room = (chatRoom.get(id));
  return room;
}

/**
 * @param {WebSocket} ws
 * @param {ChatRoom} room
 */
function createClient(ws, room) {
  const clientId = generateId();

  room.users.push({
    id: clientId,
    name: '',
    ws,
  });

  return clientId;
}

/**
 * @param {ChatRoom} room
 * @param {string} clientId
 * @param {Partial<ChatClient>} client
 */
function patchClient(room, clientId, client) {
  const oldClient = getClient(room, clientId);
  if (!oldClient) {
    throw new Error('Unknown user ID');
  }

  const index = getClientIndex(room, clientId);
  room.users.splice(index, 1, {
    ...oldClient,
    ...client,
  });
}

/**
 * @param {ChatRoom} room
 * @param {string} clientId
 */
function getClient(room, clientId) {
  return room.users.find((v) => v.id === clientId) || null;
}

/**
 * @param {ChatRoom} room
 * @param {string} clientId
 */
function getClientIndex(room, clientId) {
  return room.users.findIndex((v) => v.id === clientId);
}

/**
 * @param {ChatRoom} room
 * @param {string} clientId
 */
function deleteClient(room, clientId) {
  const client = getClient(room, clientId);
  if (client && client.ws.readyState !== client.ws.CLOSED) {
    client.ws.close();
  }

  const index = getClientIndex(room, clientId);
  room.users.splice(index, 1);
}

/**
 * @param {ChatRoom} room
 * @param {string} type
 * @param {{}} data
 */
function send(room, type, data) {
  const msg = { data, type };
  room.users.forEach((v) => v.ws.send(JSON.stringify(msg)));
}

/**
 * @param {ChatRoom} room
 */
function sendRoomStatus(room) {
  /** @type {import('../types/chat').ChatRoom} */
  const data = {
    id: room.id,
    users: Object.entries(room.users).map(([id, client]) => ({
      id,
      name: client.name,
    })),
  };
  send(room, 'room/status', data);
}

/**
 * @param {ChatRoom} room
 * @param {string} clientId
 * @param {import('../types/chat').ChatMessageRequest} data
 */
function sendUserMessage(room, clientId, data) {
  const client = getClient(room, clientId);
  if (!client) {
    throw new Error('!');
  }

  /** @type {import('../types/chat').ChatMessage} */
  const message = {
    body: data.body,
    userId: clientId,
    name: client.name,
    date: Date.now(),
    id: generateId(),
  };
  send(room, 'room/newMessage', message);
}

function generateId() {
  return Math.random().toString().slice(2);
}

/**
 * @param {WebSocket} ws
 * @param {string} id
 */
function handleChatRoom(ws, id) {
  const room = getChatRoom(id);
  const clientId = createClient(ws, room);

  sendRoomStatus(room);

  ws.on('message', (msgJson) => {
    const msg = JSON.parse(msgJson.toString());
    const { type } = msg;

    if (type === 'user/patch') {
      patchClient(room, clientId, msg.data);
      sendRoomStatus(room);
    } else if (type === 'user/post') {
      sendUserMessage(room, clientId, msg.data);
    } else {
      const data = {
        message: `Unknown message type ${type}`,
        type: 'error',
      };

      // eslint-disable-next-line no-console
      console.error(data.message);
      ws.send(JSON.stringify(data));
    }
  });

  ws.on('close', () => {
    deleteClient(room, clientId);
    sendRoomStatus(room);
  });

  ws.on('s/room/status', () => {
    sendRoomStatus(room);
  });
}
module.exports.handleChatRoom = handleChatRoom;
