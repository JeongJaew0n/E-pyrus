const { ipcRenderer } = require('electron');

// 폼 제출 이벤트
document.getElementById('crawler-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const url = document.getElementById('url').value;
  const PHPSESSID = document.getElementById('PHPSESSID').value;
  const cf_clearance = document.getElementById('cf_clearance').value;

  const headers = {
    'cookie': `PHPSESSID=${PHPSESSID}; cf_clearance=${cf_clearance}`,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7',
    'cache-control': 'max-age=0',
    'if-modified-since': 'Sat, 11 Oct 2025 09:57:56 GMT',
    'priority': 'u=0, i',
    'referer': 'https://booktoki468.com/novel?book=&yoil=&jaum=&tag=&sst=as_update&sod=desc&stx=%ED%95%99%EC%82%AC%EC%8B%A0%EA%B3%B5',
    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-arch': '"arm"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-full-version': '"141.0.7390.66"',
    'sec-ch-ua-full-version-list': '"Google Chrome";v="141.0.7390.66", "Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.66"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-platform': '"macOS"',
    'sec-ch-ua-platform-version': '"15.6.0"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
  };

  // 크롤링 시작 요청
  ipcRenderer.send('start-crawling', { url, headers });
});

// 크롤링 결과 출력
ipcRenderer.on('crawling-output', (event, message) => {
  const output = document.getElementById('output');
  output.textContent += message + '\n';
});

// 저장 버튼 클릭 이벤트
document.getElementById('save-credentials').addEventListener('click', () => {
  const url = document.getElementById('url').value;
  const PHPSESSID = document.getElementById('PHPSESSID').value;
  const cf_clearance = document.getElementById('cf_clearance').value;

  ipcRenderer.send('save-credentials', { url, PHPSESSID, cf_clearance });
});

// 불러오기 버튼 클릭 이벤트
document.getElementById('load-credentials').addEventListener('click', () => {
  ipcRenderer.send('load-credentials');
});

// 저장된 값 불러오기
ipcRenderer.on('load-credentials', (event, { url, PHPSESSID, cf_clearance }) => {
  document.getElementById('url').value = url || '';
  document.getElementById('PHPSESSID').value = PHPSESSID || '';
  document.getElementById('cf_clearance').value = cf_clearance || '';
});