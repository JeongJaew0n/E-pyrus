// fetch 요청을 대신 처리
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetch') {
    (async () => {
      try {
        // CF를 통과한 booktoki 탭을 찾아서 그 탭 컨텍스트에서 fetch
        const allTabs = await chrome.tabs.query({});
        const tabs = allTabs.filter(t => t.url && /booktoki\d*\.com/.test(t.url));
        if (tabs.length === 0) {
          sendResponse({ ok: false, error: 'booktoki 탭을 찾을 수 없습니다. 사이트를 먼저 열어주세요.' });
          return;
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: async (fetchUrl) => {
            try {
              const res = await fetch(fetchUrl);
              if (!res.ok) return { ok: false, error: String(res.status), status: res.status };
              return { ok: true, html: await res.text() };
            } catch (e) {
              return { ok: false, error: e.message };
            }
          },
          args: [msg.url],
        });

        const result = results[0].result;
        sendResponse(result);
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true;
  }
});
