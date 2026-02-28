const { ipcRenderer } = require('electron');

// 폼 제출 이벤트
document.getElementById('crawler-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const url = document.getElementById('url').value;
  const PHPSESSID = document.getElementById('PHPSESSID').value;
  const cf_clearance = document.getElementById('cf_clearance').value;

  // 새로 추가한 값들
  const rangeStart = document.getElementById('range-start').value;
  const rangeEnd = document.getElementById('range-end').value;
  const jumpNumber = document.getElementById('jump-number').value;

  const headers = {
    'cookie': `PHPSESSID=${PHPSESSID}; cf_clearance=${cf_clearance}`,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7',
    'cache-control': 'max-age=0',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
  };

  // 크롤링 시작 요청
  ipcRenderer.send('start-crawling', { url, headers, rangeStart, rangeEnd, jumpNumber });
});

// 디버그 토글 UI (체크박스) 이벤트
const debugCheckbox = document.getElementById('debug-toggle');
if (debugCheckbox) {
  debugCheckbox.addEventListener('change', () => {
    ipcRenderer.send('set-debug', debugCheckbox.checked);
  });
}

// 페이지 로드 시 현재 디버그 상태 요청
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('get-debug-state');
  // 자동으로 저장된 값 불러오기
  ipcRenderer.send('load-credentials');
});

// 디버그 상태 응답 수신 -> UI 업데이트
ipcRenderer.on('debug-state', (event, enabled) => {
  const cb = document.getElementById('debug-toggle');
  if (cb) cb.checked = !!enabled;
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

  // 추가된 항목 함께 전송
  const rangeStart = document.getElementById('range-start').value;
  const rangeEnd = document.getElementById('range-end').value;
  const jumpNumber = document.getElementById('jump-number').value;

  ipcRenderer.send('save-credentials', { url, PHPSESSID, cf_clearance, rangeStart, rangeEnd, jumpNumber });
});

// 불러오기 버튼 클릭 이벤트
document.getElementById('load-credentials').addEventListener('click', () => {
  ipcRenderer.send('load-credentials');
});

// 저장된 값 불러오기
ipcRenderer.on('load-credentials', (event, creds) => {
  const { url, PHPSESSID, cf_clearance, rangeStart, rangeEnd, jumpNumber } = creds || {};
  document.getElementById('url').value = url || '';
  document.getElementById('PHPSESSID').value = PHPSESSID || '';
  document.getElementById('cf_clearance').value = cf_clearance || '';
  if (document.getElementById('range-start')) document.getElementById('range-start').value = rangeStart || '';
  if (document.getElementById('range-end')) document.getElementById('range-end').value = rangeEnd || '';
  if (document.getElementById('jump-number')) document.getElementById('jump-number').value = jumpNumber || '';
});