// ── UI 요소 ──
const form = document.getElementById('crawler-form');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const btnFolder = document.getElementById('btn-folder');
const btnNewtab = document.getElementById('btn-newtab');
const saveFolderInput = document.getElementById('save-folder');
const output = document.getElementById('output');
const progressEl = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const progressTitle = document.getElementById('progress-title');
const progressFill = document.getElementById('progress-fill');

let crawling = false;
let stopRequested = false;
let crawlTabId = null;
let saveDirHandle = null;

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

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '_').trim();
}

// ── 폴더 선택 (탭/사이드패널 모드에서만 동작) ──
async function pickFolder() {
  try {
    saveDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    saveFolderInput.value = saveDirHandle.name;
  } catch (e) {
    if (e.name !== 'AbortError') {
      log('폴더 선택 실패: ' + e.message);
    }
  }
}

// File System Access API로 파일 저장
async function saveFile(dirHandle, subFolder, fileName, content) {
  const subDir = await dirHandle.getDirectoryHandle(subFolder, { create: true });
  const fileHandle = await subDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

// ── 목록 페이지에서 제목 + 챕터 추출 (탭에 inject) ──
function extractListData() {
  const title = document.querySelector('.view-title .view-content span b')?.textContent?.trim();
  const chapters = [];
  document.querySelectorAll('.wr-subject a').forEach(a => {
    const clone = a.cloneNode(true);
    clone.querySelectorAll('span').forEach(s => s.remove());
    const text = clone.textContent.trim();
    const href = a.href;
    if (text && href) chapters.push([text, href]);
  });
  return { title, chapters };
}

// ── 챕터 페이지에서 본문 추출 (탭에 inject) ──
function extractChapterContent() {
  const el = document.querySelector('#novel_content');
  if (!el) return null;
  el.querySelectorAll('p').forEach(p => {
    const text = p.textContent.trim();
    p.replaceWith(text + '\n\n');
  });
  return document.querySelector('#novel_content')?.textContent?.trim() || null;
}

// ── 크롤링 메인 로직 ──
async function startCrawling(url, rangeStart, rangeEnd, jumpNumber) {
  crawling = true;
  stopRequested = false;
  btnStart.disabled = true;
  btnStop.disabled = false;
  output.textContent = '';
  hideProgress();

  const useFS = !!saveDirHandle;

  try {
    // 1. 백그라운드 탭 생성 → 목록 페이지 로드
    log('목록 페이지 로딩 중...');
    const tab = await chrome.tabs.create({ url, active: false });
    crawlTabId = tab.id;
    await waitForTabLoad(tab.id);

    // 2. 목록 데이터 추출
    const [listResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractListData,
    });

    const { title, chapters: rawChapterList } = listResult.result;

    if (!title) {
      log('ERROR: 소설 제목을 찾을 수 없습니다. 사이트에 먼저 접속하여 CF를 통과해주세요.');
      return;
    }

    if (rawChapterList.length === 0) {
      log('ERROR: 챕터 목록이 비어있습니다.');
      return;
    }

    // 오름차순 정렬 (사이트는 최신순이므로 reverse)
    const chapterList = rawChapterList.slice().reverse();

    log(`소설 제목: ${title}`);
    log(`전체 챕터 수: ${chapterList.length}`);
    if (useFS) {
      log(`저장 위치: ${saveDirHandle.name}/${sanitizeFilename(title)}/`);
    } else {
      log('저장 위치: Downloads 폴더');
    }

    // 3. Range/Jump 계산
    let startIndex = 0;
    const rs = Number(rangeStart);
    const re = Number(rangeEnd);
    const jn = Number(jumpNumber);

    if (!Number.isNaN(rs) && !Number.isNaN(re) && !Number.isNaN(jn) && re > rs) {
      startIndex = jn - rs;
      if (startIndex < 0) startIndex = 0;
      if (startIndex >= chapterList.length) startIndex = chapterList.length - 1;
      log(`이어받기 ${jn}화 → 시작 인덱스 ${startIndex}`);
    } else {
      log('처음부터 시작합니다.');
    }

    const chaptersToScan = chapterList.slice(startIndex);
    const totalCount = chaptersToScan.length;
    log(`스캔 대상: ${totalCount}개 챕터\n`);

    const safeTitle = sanitizeFilename(title);

    // 4. 챕터 순차 크롤링
    for (let i = 0; i < totalCount; i++) {
      if (stopRequested) {
        log('\n크롤링이 중단되었습니다.');
        break;
      }

      const [chTitle, chLink] = chaptersToScan[i];
      updateProgress(i + 1, totalCount, chTitle);

      // 같은 탭에서 챕터 페이지로 이동
      await chrome.tabs.update(tab.id, { url: chLink });
      await waitForTabLoad(tab.id);

      // 본문 추출
      const [chResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractChapterContent,
      });

      const content = chResult.result;

      if (!content) {
        log(`[${i + 1}/${totalCount}] ${chTitle} ❌ (본문 없음)`);
        continue;
      }

      // 파일 저장
      const safeChTitle = sanitizeFilename(chTitle);

      if (useFS) {
        await saveFile(saveDirHandle, safeTitle, `${safeChTitle}.txt`, content);
      } else {
        const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        await chrome.downloads.download({
          url: dataUrl,
          filename: `${safeTitle}/${safeChTitle}.txt`,
          conflictAction: 'uniquify',
        });
      }

      log(`[${i + 1}/${totalCount}] ${chTitle} ✅`);

      // 마지막이 아니면 딜레이
      if (i < totalCount - 1 && !stopRequested) {
        await randomDelay();
      }
    }

    // 5. 탭 닫기
    try { await chrome.tabs.remove(tab.id); } catch (_) {}
    crawlTabId = null;

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

// 새 탭에서 열기
btnNewtab.addEventListener('click', () => {
  const currentUrl = document.getElementById('url').value;
  const tabUrl = chrome.runtime.getURL('popup.html') + '?mode=tab'
    + (currentUrl ? '&url=' + encodeURIComponent(currentUrl) : '');
  chrome.tabs.create({ url: tabUrl });
});

// 폴더 선택
btnFolder.addEventListener('click', () => {
  if (MODE === 'popup') {
    // 팝업에서는 폴더 선택 불가 → 새 탭으로 유도
    const currentUrl = document.getElementById('url').value;
    const tabUrl = chrome.runtime.getURL('popup.html') + '?mode=tab'
      + (currentUrl ? '&url=' + encodeURIComponent(currentUrl) : '');
    chrome.tabs.create({ url: tabUrl });
  } else {
    pickFolder();
  }
});
saveFolderInput.addEventListener('click', () => btnFolder.click());

// Start
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (crawling) return;

  const url = document.getElementById('url').value.trim();
  const rangeStart = document.getElementById('range-start').value;
  const rangeEnd = document.getElementById('range-end').value;
  const jumpNumber = document.getElementById('jump-number').value;

  if (!url) { log('URL을 입력해주세요.'); return; }

  startCrawling(url, rangeStart, rangeEnd, jumpNumber);
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
    jumpNumber: document.getElementById('jump-number').value,
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
  document.getElementById('jump-number').value = settings.jumpNumber || '';
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

  if (urlFromPage) {
    document.getElementById('url').value = urlFromPage;
  }

  // 저장된 설정 로드 (URL은 파라미터 값 우선)
  const { settings } = await chrome.storage.local.get('settings');
  if (settings) {
    if (!urlFromPage) {
      document.getElementById('url').value = settings.url || '';
    }
    document.getElementById('range-start').value = settings.rangeStart || '';
    document.getElementById('range-end').value = settings.rangeEnd || '';
    document.getElementById('jump-number').value = settings.jumpNumber || '';
  }
});
