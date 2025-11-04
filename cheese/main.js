const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { getListHtml, parseList, scanAllChapters } = require('./crawler'); // crawler.js 가져오기

let mainWindow;
const credentialsPath = path.join(app.getPath('userData'), 'credentials.json'); // 저장 경로

// 디버그 플래그 (기본 false)
let debugHtml = false;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  // 앱 시작 시 저장된 값 자동 전송 (있으면)
  try {
    if (fs.existsSync(credentialsPath)) {
      const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('load-credentials', creds);
      });
    }
  } catch (e) {
    console.error('Failed to load credentials on startup:', e);
  }
});

// 디버그 토글 수신
ipcMain.on('set-debug', (event, enabled) => {
  debugHtml = !!enabled;
  event.sender.send('debug-state', debugHtml);
});

// 디버그 상태 요청에 응답
ipcMain.on('get-debug-state', (event) => {
  event.sender.send('debug-state', debugHtml);
});

// 크롤링 요청 처리
ipcMain.on('start-crawling', async (event, { url, headers, rangeStart, rangeEnd, jumpNumber }) => {
  try {
    const html = await getListHtml(url, headers, true);
    if (!html) {
      event.sender.send('crawling-output', 'Failed to fetch the list HTML.');
      return;
    } else {
      event.sender.send('crawling-output', `Success to fetch the list HTML.`);
    }

    // 디버그가 켜져 있으면 HTML 앞부분 한 번만 전송 (최대 5000자)
    if (debugHtml) {
      const snippet = html.slice(0, 5000);
      event.sender.send('crawling-output', '--- DEBUG: HTML (first 5k chars) ---');
      event.sender.send('crawling-output', snippet);
      event.sender.send('crawling-output', '--- DEBUG: HTML END ---');
    }

    const { title, novelPath, chapterList: rawChapterList } = parseList(html);
    if (rawChapterList.length === 0) {
      event.sender.send('crawling-output', 'No chapters found.');
      return;
    }

    // 항상 "start -> end" 순서로 맞추기 위해 파싱된 목록을 뒤집음
    // (사이트에서 최신부터 내려오는 경우에도 사용자 입력 방식(start/end/jump)에 맞게 정렬)
    const chapterList = rawChapterList.slice().reverse();

    event.sender.send('crawling-output', `Novel Title: ${title}`);
    event.sender.send('crawling-output', `Total list count: ${chapterList.length}`);

    // 간단한 start/end/jump 계산: startIndex = jump - start
    let startIndex = 0;
    const rs = Number(rangeStart);
    const re = Number(rangeEnd);
    const jn = Number(jumpNumber);

    if (!Number.isNaN(rs) && !Number.isNaN(re) && !Number.isNaN(jn) && re > rs) {
      startIndex = jn - rs;
      if (startIndex < 0) startIndex = 0;
      if (startIndex >= chapterList.length) startIndex = chapterList.length - 1;
      event.sender.send('crawling-output', `Mapped jump ${jn} -> start index ${startIndex} (simple: jump-start)`);
    } else {
      event.sender.send('crawling-output', 'No valid range/jump provided — starting from beginning.');
      startIndex = 0;
    }

    // 슬라이스만 해서 그 지점부터 스캔 (더 이상 reverse하지 않음)
    const chaptersToScan = chapterList.slice(startIndex);

    event.sender.send('crawling-output', `Scanning ${chaptersToScan.length} chapters starting at index ${startIndex}.`);

    await scanAllChapters(chaptersToScan, headers, novelPath);
    event.sender.send('crawling-output', 'All chapters scanned.');
  } catch (error) {
    event.sender.send('crawling-output', `An error occurred: ${error.message}`);
  }
});

// 사용자 입력 저장
ipcMain.on('save-credentials', (event, credentials) => {
  // credentials에 rangeStart, rangeEnd, jumpNumber 포함 가능
  try {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), 'utf-8');
    console.log('Credentials saved:', credentials);
    event.sender.send('crawling-output', 'Credentials saved.');
  } catch (e) {
    console.error('Failed to save credentials:', e);
    event.sender.send('crawling-output', 'Failed to save credentials.');
  }
});

// 사용자 입력 불러오기
ipcMain.on('load-credentials', (event) => {
  if (fs.existsSync(credentialsPath)) {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    event.sender.send('load-credentials', credentials);
  } else {
    event.sender.send('load-credentials', { url: '', PHPSESSID: '', cf_clearance: '', rangeStart: '', rangeEnd: '', jumpNumber: '' });
  }
});