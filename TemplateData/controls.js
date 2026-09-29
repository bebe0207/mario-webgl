(() => {
  // 取得遊戲畫布、虛擬按鍵、全螢幕按鈕與轉向提示。
  const container = document.querySelector('#unity-container');
  const canvas = document.querySelector('#unity-canvas');
  const fullscreen = document.querySelector('#unity-fullscreen-button');
  const status = document.querySelector('#fullscreen-status');
  const rotateHint = document.querySelector('#orientation-lock');
  const buttons = [...document.querySelectorAll('[data-keycode]')];
  const pointers = new Map(); // 每根手指各自紀錄，允許同時移動與跳躍。
  const physicalKeys = new Map();
  const injectedEvents = new WeakSet();
  const playableCallbacks = [];
  let unityInstance = null;
  let blocked = false;
  let pausedForOrientation = false;

  // iPad 使用桌面版網站時可能回報 Macintosh，因此也檢查觸控點數。
  const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
  const portrait = matchMedia('(orientation: portrait)');

  // Unity 接收鍵盤事件：key 是字元，code 是實體鍵名，兩者不能混用。
  function dispatchKey(type, key, code, keyCode) {
    const event = new KeyboardEvent(type, {
      key, code, keyCode, which: keyCode, bubbles: true, cancelable: true
    });
    injectedEvents.add(event);
    canvas.dispatchEvent(event);
  }
  function sendKey(button, type) {
    dispatchKey(type, button.dataset.key, button.dataset.code, Number(button.dataset.keycode));
    // 紅色按鈕在同一個事件處理流程送出 Enter 與 S；放開時兩鍵也一起釋放。
    // 取消觸控、轉向或離開分頁時，仍會透過同一函式釋放兩個按鍵。
    if (button.dataset.extraKeycode) {
      dispatchKey(type, button.dataset.extraKey, button.dataset.extraCode, Number(button.dataset.extraKeycode));
    }
  }

  // 放開最後一根按住該按鈕的手指時，才送出 keyup，避免多點觸控互相中斷。
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
  function releaseAll() {
    [...pointers.keys()].forEach(release);
    physicalKeys.forEach(event => dispatchKey('keyup', event.key, event.code, event.keyCode));
    physicalKeys.clear();
  }

  // 直向時遮住遊戲並停用操作；橫向後恢復。桌機不受此限制。
  function syncOrientation() {
    const nextBlocked = mobileDevice && portrait.matches;
    if (nextBlocked && !blocked) releaseAll();
    blocked = nextBlocked;
    container.classList.toggle('portrait-blocked', blocked);
    rotateHint.hidden = !blocked;
    canvas.inert = blocked;
    buttons.forEach(button => { button.disabled = !unityInstance || blocked; });

    // 這份 Unity 建置提供 pauseMainLoop / resumeMainLoop，用來暫停與恢復遊戲。
    // 只恢復由「轉成直向」造成的暫停，不改動遊戲內部的暫停選單。
    if (unityInstance) {
      const module = unityInstance.Module;
      if (blocked && !pausedForOrientation && module?.pauseMainLoop) {
        module.pauseMainLoop();
        pausedForOrientation = true;
      } else if (!blocked && pausedForOrientation) {
        module.resumeMainLoop();
        pausedForOrientation = false;
        canvas.focus({ preventScroll: true });
      }
    }
    if (!blocked) playableCallbacks.splice(0).forEach(callback => callback());
  }

  // 在 Unity 的事件監聽器之前攔截直向輸入，外接鍵盤也不能繞過橫向限制。
  ['keydown', 'keyup', 'keypress'].forEach(type => {
    window.addEventListener(type, event => {
      if (injectedEvents.has(event)) return;
      if (blocked) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (type === 'keydown') physicalKeys.set(event.code || event.key, event);
      if (type === 'keyup') physicalKeys.delete(event.code || event.key);
    }, true);
  });

  buttons.forEach(button => {
    // 按下送 keydown、放開送 keyup，長按方向鍵可以持續移動。
    button.addEventListener('pointerdown', event => {
      if (blocked || button.disabled || event.button !== 0) return;
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

  // 切換分頁、離開畫面、改變方向時清除長按，避免角色持續移動。
  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  window.addEventListener('resize', syncOrientation);
  window.addEventListener('orientationchange', syncOrientation);
  if (portrait.addEventListener) portrait.addEventListener('change', syncOrientation);
  else portrait.addListener(syncOrientation);

  fullscreen.addEventListener('click', async () => {
    releaseAll();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.requestFullscreen) {
        await container.requestFullscreen();
        // 支援的瀏覽器可鎖定橫向；不支援時，仍由上方遮罩強制橫向操作。
        if (mobileDevice && screen.orientation?.lock) {
          try { await screen.orientation.lock('landscape'); } catch { /* 保留轉向提示作為替代。 */ }
        }
      } else {
        status.textContent = '此瀏覽器不支援全螢幕，遊戲已填滿可用視窗。';
        return;
      }
      status.textContent = '';
    } catch {
      status.textContent = '無法進入全螢幕，請使用目前視窗。';
    } finally {
      syncOrientation();
      if (!blocked) canvas.focus({ preventScroll: true });
    }
  });
  document.addEventListener('fullscreenchange', () => {
    releaseAll();
    const label = document.fullscreenElement ? '離開全螢幕' : '進入全螢幕';
    fullscreen.textContent = label;
    fullscreen.setAttribute('aria-label', label);
    syncOrientation();
  });

  // 提供給 index.html：直向首次開啟時，先等使用者轉橫向才啟動遊戲。
  window.gameControls = {
    whenPlayable(callback) {
      if (blocked) playableCallbacks.push(callback);
      else callback();
    },
    setUnityInstance(instance) {
      unityInstance = instance;
      syncOrientation();
    }
  };
  syncOrientation();
})();
