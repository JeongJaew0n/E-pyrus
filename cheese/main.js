const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { getListHtml, parseList, scanAllChapters } = require('./crawler'); // crawler.js 가져오기

let mainWindow;
const credentialsPath = path.join(app.getPath('userData'), 'credentials.json'); // 저장 경로

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 필요 시 preload 스크립트 추가
      nodeIntegration: true, // Node.js 모듈 사용 가능
      contextIsolation: false, // 렌더러에서 Node.js API 접근 허용
    },
  });

  mainWindow.loadFile('index.html'); // HTML 파일 로드
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 크롤링 요청 처리
ipcMain.on('start-crawling', async (event, { url, headers }) => {
  try {
    const html = await getListHtml(url, headers, true);
    if (!html) {
      event.sender.send('crawling-output', 'Failed to fetch the list HTML.');
      return;
    } else {
      event.sender.send('crawling-output', `Success to fetch the list HTML. \n ${html}`);
    }

    const { title, novelPath, chapterList } = parseList(html);
    if (chapterList.length === 0) {
      event.sender.send('crawling-output', 'No chapters found.');
      return;
    }

    event.sender.send('crawling-output', `Novel Title: ${title}`);
    event.sender.send('crawling-output', `Chapters Found: ${chapterList.length}`);
    scanAllChapters(chapterList, headers, novelPath);
    // chapterList.forEach((chapter) => {
    //   event.sender.send('crawling-output', `Chapter: ${chapter.title}, Link: ${chapter.link}`);
    // });
  } catch (error) {
    event.sender.send('crawling-output', `An error occurred: ${error.message}`);
  }
});

// 사용자 입력 저장
ipcMain.on('save-credentials', (event, credentials) => {
  fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), 'utf-8');
  console.log('Credentials saved:', credentials);
});

// 사용자 입력 불러오기
ipcMain.on('load-credentials', (event) => {
  if (fs.existsSync(credentialsPath)) {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    event.sender.send('load-credentials', credentials);
  } else {
    event.sender.send('load-credentials', { url: '', PHPSESSID: '', cf_clearance: '' });
  }
});