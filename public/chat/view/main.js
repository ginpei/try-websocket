/**
 * @typedef {import('../../../types/chat').ChatUser} ChatUser
 */

/**
 * @typedef {import('../../../types/chat').ChatRoom} ChatRoom
 */

/**
 * @typedef {import('../../../types/chat').ChatMessage} ChatMessage
 */

const context = {
  id: getIdFromPathName(),

  /** @type {ChatMessage[]} */
  messages: [],

  name: '',

  /** @type {'start' | 'connecting' | 'joined'} */
  stage: ('start'),

  /** @type {ChatUser[]} */
  users: [],

  /** @type {WebSocket | null} */
  ws: null,
};

main();

function main() {
  /** @type {HTMLFormElement} */
  (q('#joinForm')).onsubmit = (event) => {
    event.preventDefault();

    /** @type {HTMLInputElement} */
    const elName = (q('#newName'));
    const name = elName.value;
    if (!name) {
      return;
    }

    join({ name });
  };

  /** @type {HTMLFormElement} */
  (q('#chatForm')).onsubmit = (event) => {
    event.preventDefault();

    /** @type {HTMLInputElement} */
    const elMessage = (q('#message'));
    const body = elMessage.value;
    if (!body) {
      return;
    }
    elMessage.value = '';

    sendChatMessage({ body });
  };

  setStage('start');
}

/**
 * @param {{ name: string; }} options
 */
function join({ name }) {
  context.name = name;

  window.setTimeout(() => {
    const path = `/chat/${context.id}`;
    const url = `ws://${window.location.host}${path}`;
    context.ws = new WebSocket(url);
    context.ws.onopen = onSocketOpen;
    context.ws.onmessage = onSocketMessage;
    context.ws.onclose = onSocketClose;
    context.ws.onerror = onSocketError;
  }, 300);

  setStage('connecting');
}

function onSocketOpen() {
  if (!context.ws) {
    throw new Error('!');
  }

  q('#name').textContent = context.name;

  const msg = {
    type: 'user/patch',
    data: {
      name: context.name,
    },
  };
  context.ws.send(JSON.stringify(msg));

  setStage('joined');
}

/**
 * @param {MessageEvent} event
 */
function onSocketMessage({ data: json }) {
  const { data, type } = JSON.parse(json);

  if (type === 'room/status') {
    updateRoom(data);
    render();
  } else if (type === 'room/newMessage') {
    pushMessage(data);
    render();
  } else if (type === 'error') {
    console.error(new Error(data.message));
  } else {
    throw new Error(`Unknown message type ${type}`);
  }
}

/**
 * @param {CloseEvent} event
 */
function onSocketClose(event) {
  setStage('start');
  console.log('# event', event);
}

/**
 * @param {Event} event
 */
function onSocketError(event) {
  console.log('# event', event);
}

/**
 * @param {typeof context['stage']} stage
 */
function setStage(stage) {
  context.stage = stage;

  const elStages = qq('[data-stage]');
  const elCurrentStage = elStages.find((v) => v.dataset.stage === stage);
  if (!elCurrentStage) {
    throw new Error(`Unknown stage "${stage}"`);
  }

  // eslint-disable-next-line no-param-reassign
  elStages.forEach((v) => { v.hidden = v !== elCurrentStage; });
}

/**
 * @param {ChatRoom} room
 */
function updateRoom(room) {
  context.users = room.users;
}

/**
 * @param {ChatMessage} message
 */
function pushMessage(message) {
  context.messages.push(message);
}

function render() {
  renderRoom();
  renderMessages();
}

function renderRoom() {
  const elUsers = context.users.map((v) => qt('#t-chatUser', {
    name: v.name,
  }));

  const elList = q('#userList');
  elList.innerHTML = '';
  elUsers.forEach((v) => elList.appendChild(v));
}

function renderMessages() {
  const elList = q('#chatMessageList');

  const remainingMessages = _findRemainingMessages(elList);
  remainingMessages.forEach((message) => {
    const el = renderOneMessage(message);
    elList.prepend(el);
  });

  // ----

  /**
   * @param {HTMLElement} el
   */
  // eslint-disable-next-line no-underscore-dangle
  function _findRemainingMessages(el) {
    const elLast = el.children[0];
    if (!elLast) {
      return context.messages;
    }

    if (!(elLast instanceof HTMLElement)) {
      throw new Error('!');
    }

    const lastId = elLast.dataset.id || '';
    const lastIndex = context.messages.findIndex((v) => v.id === lastId);
    const remaining = context.messages.slice(lastIndex + 1);

    return remaining;
  }
}

/**
 * @param {ChatMessage} message
 */
function renderOneMessage(message) {
  const el = qt('#t-chatMessage', message);

  el.dataset.id = message.id;

  const elDate = q('[data-js="date"]', el);
  elDate.textContent = new Date(message.date).toTimeString();

  return el;
}

/**
 * @param {{ body: string }} options
 */
function sendChatMessage({ body }) {
  send('user/post', { body });
}

/**
 * @param {string} type
 * @param {{}} data
 */
function send(type, data) {
  if (!context.ws) {
    throw new Error('WebSocket is not ready');
  }

  context.ws.send(JSON.stringify({ data, type }));
}

/**
 * @param {string} selector
 * @param {Element | Document | DocumentFragment} root
 * @returns {HTMLElement}
 */
function q(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`Element "${selector}" is not found`);
  }

  if (!(el instanceof HTMLElement)) {
    throw new Error(`Element "${selector}" is not HTMLElement`);
  }

  return el;
}

/**
 * Finds template.
 * @param {string} selector
 * @param {Record<string, any>} data
 * @returns {HTMLElement}
 */
function qt(selector, data) {
  const elTemplate = q(selector);
  if (!(elTemplate instanceof HTMLTemplateElement)) {
    throw new Error(`Element "${selector}" must be HTMLTemplateElement`);
  }

  const { firstElementChild } = elTemplate.content;
  const doc = firstElementChild && firstElementChild.cloneNode(true);
  if (!doc || !(doc instanceof HTMLElement)) {
    throw new Error(`Element "${selector}" must contain one HTMLElement`);
  }

  Object.entries(data).forEach(([key, value]) => {
    const el = doc.querySelector(`[data-value="${key}"]`);
    if (el) {
      el.textContent = value === undefined ? '' : String(value);
    }
  });

  return doc;
}

/**
 * @param {string} selector
 * @returns {HTMLElement[]}
 */
function qq(selector) {
  const els = [...document.querySelectorAll(selector)];
  if (!els.every((v) => v instanceof HTMLElement)) {
    throw new Error(`All of elements "${selector}" are not HTMLElement`);
  }
  /** @type {HTMLElement[]} */
  const result = (els);
  return result;
}

function getIdFromPathName() {
  const { pathname } = window.location;
  const m = pathname.match(/^\/chat\/([0-9]+)(?:\/|$)/);
  const target = m ? m[1] : '';
  return target;
}
