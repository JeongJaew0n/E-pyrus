// booktoki*/novel/* 페이지에서만 실행됨 (manifest include_globs)
(function () {
  if (document.getElementById('cheese-crawler-btn')) return;

  // ── 플로팅 버튼 ──
  const btn = document.createElement('div');
  btn.id = 'cheese-crawler-btn';
  btn.textContent = '📖';
  btn.title = 'Cheese Crawler';
  document.body.appendChild(btn);

  // ── 사이드 패널 ──
  const panel = document.createElement('div');
  panel.id = 'cheese-crawler-panel';

  const iframe = document.createElement('iframe');
  const panelUrl = chrome.runtime.getURL('popup.html') + '?url=' + encodeURIComponent(window.location.href);
  iframe.src = panelUrl;
  panel.appendChild(iframe);
  document.body.appendChild(panel);

  let open = false;

  btn.addEventListener('click', () => {
    open = !open;
    panel.classList.toggle('open', open);
    btn.classList.toggle('active', open);
  });
})();
