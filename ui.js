const readline = require('readline');
const { getListHtml, parseList, scanAllChapters } = require('./crawler');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 사용자 입력 받기
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

(async () => {
  try {
    const url = await askQuestion('Enter the URL: ');
    const PHPSESSID = await askQuestion('Enter PHPSESSID: ');
    const cf_clearance = await askQuestion('Enter cf_clearance: ');

    const headers = {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'no-cache',
      'cookie': `PHPSESSID=${PHPSESSID}; cf_clearance=${cf_clearance}`,
      'pragma': 'no-cache',
      'referer': 'https://booktoki468.com',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    };

    // HTML 가져오기
    const html = await getListHtml(url, headers, true);
    if (!html) {
      console.error('Failed to fetch the list HTML.');
      return;
    }

    // HTML 파싱
    const { title, novelPath, chapterList } = parseList(html);
    if (chapterList.length === 0) {
      console.error('No chapters found.');
      return;
    }

    console.log(`Novel Title: ${title}`);
    console.log(`Chapters Found: ${chapterList.length}`);

    // 모든 챕터 스캔
    await scanAllChapters(chapterList, headers, novelPath);
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  } finally {
    rl.close();
  }
})();