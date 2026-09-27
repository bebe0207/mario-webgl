(() => {
  const container = document.querySelector('#unity-container');
  const canvas = document.querySelector('#unity-canvas');
  const controls = document.querySelector('#touch-controls');
  const fullscreen = document.querySelector('#unity-fullscreen-button');
  const status = document.querySelector('#fullscreen-status');
  const pointers = new Map();

  // Bubble through the canvas, document and window to Unity's keyboard listener.
  function sendKey(button, type) {
    canvas.dispatchEvent(new KeyboardEvent(type, {
      key: button.dataset.key, code: button.dataset.key,
      keyCode: Number(button.dataset.keycode), which: Number(button.dataset.keycode),
      bubbles: true, cancelable: true
    }));
  }
  function release(pointerId) {
    const button = pointers.get(pointerId);
    if (!button) return;
    pointers.delete(pointerId);
    if (![...pointers.values()].includes(button)) {
      sendKey(button, 'keyup');
      button.classList.remove('is-pressed');
    }
    if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
  }
  function releaseAll() { [...pointers.keys()].forEach(release); }
  controls.querySelectorAll('button').forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (button.disabled || event.button !== 0) return;
      event.preventDefault();
      canvas.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
      const alreadyPressed = [...pointers.values()].includes(button);
      pointers.set(event.pointerId, button);
      if (!alreadyPressed) sendKey(button, 'keydown');
      button.classList.add('is-pressed');
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
      button.addEventListener(type, event => release(event.pointerId));
    });
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  fullscreen.addEventListener('click', async () => {
    releaseAll();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.requestFullscreen) await container.requestFullscreen();
      else {
        status.textContent = '此瀏覽器不支援全螢幕，遊戲已填滿可用視窗。';
        return;
      }
      status.textContent = '';
    } catch {
      status.textContent = '無法進入全螢幕，遊戲仍可在目前視窗操作。';
    } finally {
      canvas.focus({ preventScroll: true });
    }
  });
  document.addEventListener('fullscreenchange', () => {
    releaseAll();
    const label = document.fullscreenElement ? '離開全螢幕' : '進入全螢幕';
    fullscreen.textContent = label;
    fullscreen.setAttribute('aria-label', label);
  });
})();
