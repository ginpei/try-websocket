/** @type {HTMLButtonElement} */
const elStart = (document.querySelector('#start'));
elStart.disabled = false;
elStart.onclick = () => {
  const id = Math.random().toString().slice(2);
  const path = `/chat/${id}`;
  window.location.href = path;
};
