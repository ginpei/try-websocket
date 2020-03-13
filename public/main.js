/** @type {WebSocket | null} */
let s = null;

renderState();

/** @type {HTMLButtonElement} */
(document.querySelector('#start')).onclick = () => {
  if (s && s.readyState !== s.CLOSED) {
    s.close();
  }

  s = new WebSocket('ws://localhost:3000/echo');

  s.onopen = onEvent;
  s.onerror = onEvent;
  s.onclose = onEvent;
  s.onmessage = onEvent;
};

/** @type {HTMLButtonElement} */
(document.querySelector('#close')).onclick = () => {
  if (!s) {
    return;
  }

  s.close();
};

/** @type {HTMLFormElement} */
(document.querySelector('#form')).onsubmit = (event) => {
  event.preventDefault();

  if (!s) {
    return;
  }

  /** @type {HTMLInputElement} */
  const elMessage = (document.querySelector('#message'));
  const message = elMessage.value;
  s.send(message);
};

/**
 * @param {Event} event
 */
function onEvent(event) {
  // eslint-disable-next-line no-console
  console.log('# ', event.type, event);
  renderState();
}

function renderState() {
  const state = s && s.readyState;
  let sStatus = '';

  if (!s) {
    sStatus = 'Empty';
  } else if (state === s.OPEN) {
    sStatus = 'Open';
  } else if (state === s.CLOSED) {
    sStatus = 'Closed';
  } else {
    sStatus = `Unknown (${state})`;
  }

  /** @type {HTMLSpanElement} */
  const el = (document.querySelector('#status'));
  el.textContent = sStatus;
}
