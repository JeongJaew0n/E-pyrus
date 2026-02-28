// fetch 요청을 대신 처리 (sidepanel iframe에서는 host_permissions이 적용되지 않으므로)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetch') {
    fetch(msg.url)
      .then(res => res.ok ? res.text() : Promise.reject(res.status))
      .then(html => sendResponse({ ok: true, html }))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true; // async sendResponse
  }
});
