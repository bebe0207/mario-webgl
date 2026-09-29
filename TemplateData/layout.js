(() => {
  // Safari 工具列展開、收合時，以真正可見的視窗範圍重新配置。
  const container = document.querySelector('#unity-container');
  const stage = document.querySelector('#game-stage');
  const canvas = document.querySelector('#unity-canvas');
  const ratio = 960 / 600; // 沿用原始 Unity WebGL 畫布比例，避免超寬螢幕改變取景。
  let frame = 0;

  function fitCanvas() {
    const width = Math.max(0, Math.min(stage.clientWidth, stage.clientHeight * ratio));
    canvas.style.width = width + 'px';
    canvas.style.height = width / ratio + 'px';
  }
  function updateViewport() {
    frame = 0;
    const view = window.visualViewport;
    const fullscreen = !!document.fullscreenElement;
    container.style.setProperty('--view-left', (fullscreen ? 0 : view?.offsetLeft || 0) + 'px');
    container.style.setProperty('--view-top', (fullscreen ? 0 : view?.offsetTop || 0) + 'px');
    container.style.setProperty('--view-width', (fullscreen ? window.innerWidth : view?.width || window.innerWidth) + 'px');
    container.style.setProperty('--view-height', (fullscreen ? window.innerHeight : view?.height || window.innerHeight) + 'px');
    fitCanvas();
  }
  function scheduleLayout() {
    if (!frame) frame = requestAnimationFrame(updateViewport);
  }
  // 只改顯示尺寸；Unity 自行依裝置像素密度調整繪圖緩衝區。
  new ResizeObserver(fitCanvas).observe(stage);
  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('orientationchange', scheduleLayout);
  window.visualViewport?.addEventListener('resize', scheduleLayout);
  window.visualViewport?.addEventListener('scroll', scheduleLayout);
  document.addEventListener('fullscreenchange', scheduleLayout);
  updateViewport();
})();
