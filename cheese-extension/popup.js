// ── UI 요소 ──
const form = document.getElementById('crawler-form');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const btnNewtab = document.getElementById('btn-newtab');
const multiPageCheck = document.getElementById('multi-page');
const pageCountWrap = document.getElementById('page-count-wrap');
const pageCountInput = document.getElementById('page-count');
const output = document.getElementById('output');
const progressEl = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const progressTitle = document.getElementById('progress-title');
const progressFill = document.getElementById('progress-fill');

let crawling = false;
let stopRequested = false;

// 모드 감지: popup / sidepanel / tab
function detectMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'tab') return 'tab';
  if (params.get('url')) return 'sidepanel';
  return 'popup';
}

const MODE = detectMode();

// ── 유틸 ──
function log(msg) {
  output.textContent += msg + '\n';
  output.scrollTop = output.scrollHeight;
}

function updateProgress(current, total, chapterTitle) {
  progressEl.classList.remove('hidden');
  progressText.textContent = `${current} / ${total}`;
  progressTitle.textContent = chapterTitle || '';
  progressFill.style.width = `${(current / total) * 100}%`;
}

function hideProgress() {
  progressEl.classList.add('hidden');
}

function randomDelay() {
  const ms = Math.floor(Math.random() * (7000 - 4000 + 1)) + 4000;
  return new Promise(r => setTimeout(r, ms));
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '_').trim();
}

// ── fetch를 background service worker를 통해 수행 ──
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'fetch', url }, (res) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!res || !res.ok) {
        reject(new Error(res?.error || 'fetch 실패'));
      } else {
        resolve(res.html);
      }
    });
  });
}

// ── HTML 파싱 유틸 ──
function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

// ── 멀티페이지 URL 생성 ──
function buildPageUrls(baseUrl, pageCount) {
  const url = new URL(baseUrl);
  // 기존 spage 파라미터 제거 후 1부터 생성
  const urls = [];
  for (let i = 1; i <= pageCount; i++) {
    url.searchParams.set('spage', i);
    urls.push(url.href);
  }
  return urls;
}

// ── 목록 페이지에서 제목 + 챕터 추출 ──
function extractListData(doc, baseUrl) {
  const title = doc.querySelector('.view-title .view-content span b')?.textContent?.trim();
  const chapters = [];
  doc.querySelectorAll('.wr-subject a').forEach(a => {
    const clone = a.cloneNode(true);
    clone.querySelectorAll('span').forEach(s => s.remove());
    const text = clone.textContent.trim();
    const href = a.getAttribute('href');
    if (text && href) {
      const fullUrl = new URL(href, baseUrl).href;
      chapters.push([text, fullUrl]);
    }
  });
  return { title, chapters };
}

// ── 챕터 페이지에서 본문 추출 ──
function extractChapterContent(doc) {
  const el = doc.querySelector('#novel_content');
  if (!el) return null;
  el.querySelectorAll('p').forEach(p => {
    const text = p.textContent.trim();
    p.replaceWith(text + '\n\n');
  });
  return doc.querySelector('#novel_content')?.textContent?.trim() || null;
}

// ── 크롤링 메인 로직 ──
async function startCrawling(urls, rangeStart, rangeEnd) {
  crawling = true;
  stopRequested = false;
  btnStart.disabled = true;
  btnStop.disabled = false;
  output.textContent = '';
  hideProgress();

  try {
    // 1. 모든 목록 페이지에서 챕터 수집
    let title = null;
    const allChapters = [];
    const seenHrefs = new Set();

    for (let i = 0; i < urls.length; i++) {
      if (stopRequested) break;
      log(`목록 페이지 ${i + 1}/${urls.length} 로딩 중...`);

      let listHtml;
      try {
        listHtml = await fetchPage(urls[i]);
      } catch (e) {
        log(`ERROR: 목록 페이지 로드 실패 (${e.message}). 사이트에 먼저 접속하여 CF를 통과해주세요.`);
        return;
      }
      const listDoc = parseHTML(listHtml);
      const { title: pageTitle, chapters } = extractListData(listDoc, urls[i]);

      if (!title && pageTitle) title = pageTitle;

      for (const [chTitle, chLink] of chapters) {
        if (!seenHrefs.has(chLink)) {
          seenHrefs.add(chLink);
          allChapters.push([chTitle, chLink]);
        }
      }
    }

    if (!title) {
      log('ERROR: 소설 제목을 찾을 수 없습니다. 사이트에 먼저 접속하여 CF를 통과해주세요.');
      return;
    }

    if (allChapters.length === 0) {
      log('ERROR: 챕터 목록이 비어있습니다.');
      return;
    }

    // 오름차순 정렬 (사이트는 최신순이므로 reverse)
    const chapterList = allChapters.slice().reverse();

    log(`소설 제목: ${title}`);
    log(`전체 챕터 수: ${chapterList.length}`);

    // 2. Range 계산
    const rs = Number(rangeStart);
    const re = Number(rangeEnd);
    let startIdx = 0;
    let endIdx = chapterList.length;

    if (!Number.isNaN(rs) && rs > 0) {
      startIdx = rs - 1;
      if (startIdx < 0) startIdx = 0;
    }
    if (!Number.isNaN(re) && re > 0) {
      endIdx = re;
      if (endIdx > chapterList.length) endIdx = chapterList.length;
    }

    const chaptersToScan = chapterList.slice(startIdx, endIdx);
    const totalCount = chaptersToScan.length;
    log(`스캔 대상: ${startIdx + 1}~${startIdx + totalCount}화 (${totalCount}개)\n`);

    const safeTitle = sanitizeFilename(title);

    // 3. 챕터 순차 크롤링
    for (let i = 0; i < totalCount; i++) {
      if (stopRequested) {
        log('\n크롤링이 중단되었습니다.');
        break;
      }

      const [chTitle, chLink] = chaptersToScan[i];
      updateProgress(i + 1, totalCount, chTitle);

      // 챕터 페이지 fetch
      let chHtml;
      try {
        chHtml = await fetchPage(chLink);
      } catch (e) {
        log(`[${i + 1}/${totalCount}] ${chTitle} ❌ (${e.message})`);
        continue;
      }
      const chDoc = parseHTML(chHtml);
      const content = extractChapterContent(chDoc);

      if (!content) {
        log(`[${i + 1}/${totalCount}] ${chTitle} ❌ (본문 없음)`);
        continue;
      }

      // 파일 저장
      const safeChTitle = sanitizeFilename(chTitle);
      const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
      await chrome.downloads.download({
        url: dataUrl,
        filename: `${safeTitle}/${safeChTitle}.txt`,
        conflictAction: 'uniquify',
      });

      log(`[${i + 1}/${totalCount}] ${chTitle} ✅`);

      // 마지막이 아니면 딜레이
      if (i < totalCount - 1 && !stopRequested) {
        await randomDelay();
      }
    }

    if (!stopRequested) {
      log('\n모든 챕터 스캔 완료! 🚀');
    }

  } catch (err) {
    log(`\nERROR: ${err.message}`);
  } finally {
    crawling = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
  }
}

// ── 이벤트 리스너 ──

// 여러 페이지 체크박스 토글
multiPageCheck.addEventListener('change', () => {
  pageCountWrap.classList.toggle('hidden', !multiPageCheck.checked);
});

// 새 탭에서 열기
btnNewtab.addEventListener('click', () => {
  const currentUrl = document.getElementById('url').value;
  const tabUrl = chrome.runtime.getURL('popup.html') + '?mode=tab'
    + (currentUrl ? '&url=' + encodeURIComponent(currentUrl) : '');
  chrome.tabs.create({ url: tabUrl });
});

// Start
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (crawling) return;

  const url = document.getElementById('url').value.trim();
  const rangeStart = document.getElementById('range-start').value;
  const rangeEnd = document.getElementById('range-end').value;

  if (!url) { log('URL을 입력해주세요.'); return; }

  let urls;
  if (multiPageCheck.checked) {
    const count = parseInt(pageCountInput.value);
    if (!count || count < 1) { log('페이지 수를 입력해주세요.'); return; }
    urls = buildPageUrls(url, count);
    log(`${count}개 페이지 URL 생성`);
  } else {
    urls = [url];
  }

  startCrawling(urls, rangeStart, rangeEnd);
});

// Stop
btnStop.addEventListener('click', () => {
  stopRequested = true;
  log('중단 요청됨... 현재 챕터 완료 후 중단합니다.');
});

// Save
btnSave.addEventListener('click', async () => {
  const data = {
    url: document.getElementById('url').value,
    rangeStart: document.getElementById('range-start').value,
    rangeEnd: document.getElementById('range-end').value,
    multiPage: multiPageCheck.checked,
    pageCount: pageCountInput.value,
  };
  await chrome.storage.local.set({ settings: data });
  log('설정 저장 완료.');
});

// Load
btnLoad.addEventListener('click', loadSettings);

async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) return;
  document.getElementById('url').value = settings.url || '';
  document.getElementById('range-start').value = settings.rangeStart || '';
  document.getElementById('range-end').value = settings.rangeEnd || '';
  multiPageCheck.checked = settings.multiPage || false;
  pageCountInput.value = settings.pageCount || '';
  pageCountWrap.classList.toggle('hidden', !multiPageCheck.checked);
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const urlFromPage = params.get('url');

  if (MODE === 'tab') {
    document.body.classList.add('tab-mode');
  } else if (MODE === 'sidepanel') {
    document.body.classList.add('sidepanel');
  }

  // 저장된 설정 로드
  const { settings } = await chrome.storage.local.get('settings');

  if (urlFromPage) {
    document.getElementById('url').value = urlFromPage;
  } else if (settings) {
    document.getElementById('url').value = settings.url || '';
  }

  if (settings) {
    document.getElementById('range-start').value = settings.rangeStart || '';
    document.getElementById('range-end').value = settings.rangeEnd || '';
    multiPageCheck.checked = settings.multiPage || false;
    pageCountInput.value = settings.pageCount || '';
    pageCountWrap.classList.toggle('hidden', !multiPageCheck.checked);
  }
});
