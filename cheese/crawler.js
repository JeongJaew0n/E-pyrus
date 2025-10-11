const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// HTML 가져오기
async function getListHtml(url, headers, saveFile = false) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 요청 헤더 설정
  await page.setExtraHTTPHeaders(headers);

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    return content;
  } catch (error) {
    console.error(`Error in getListHtml: ${error.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

// HTML 파싱
function parseList(html) {
  const $ = cheerio.load(html);

  // 노벨 제목 가져오기
  const title = $('.view-title .view-content span b').text().trim();

  // 챕터 목록 가져오기
  const chapterList = [];
  $('.wr-subject a').each((_, element) => {
    const chapterTitle = $(element).clone().children('span').remove().end().text().trim();
    const chapterLink = $(element).attr('href');
    chapterList.push({ title: chapterTitle, link: chapterLink });
  });

  return { title, chapterList };
}

module.exports = { getListHtml, parseList };