const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

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
  if (!title) {
    throw new Error('Novel title not found in the HTML.');
  }

  // 결과 저장 폴더 생성
  const novelPath = path.join(folderPath, title);
  if (!fs.existsSync(novelPath)) {
    fs.mkdirSync(novelPath, { recursive: true });
  }

  // 챕터 목록 가져오기
  const chapterList = [];
  $('.wr-subject a').each((_, element) => {
    const chapterTitle = $(element).clone().children('span').remove().end().text().trim();
    const chapterLink = $(element).attr('href');
    chapterList.push([chapterTitle, chapterLink]);
  });

  return { title, novelPath, chapterList };
}

// 결과 저장 폴더
const folderPath = 'results';

// Chapter 하나를 스캔
async function scanChapter(ch, headers, novelPath) {
  const [title, link] = ch;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 요청 헤더 설정
  await page.setExtraHTTPHeaders(headers);

  try {
    // 챕터 페이지 열기
    await page.goto(link, { waitUntil: 'networkidle2' });

    // HTML 가져오기
    const content = await page.content();
    const $ = cheerio.load(content);

    // 소설 내용 추출
    const novelContentElement = $('#novel_content');
    if (!novelContentElement.length) {
      throw new Error(`Content not found for chapter: ${title}`);
    }

    // <p> 태그 처리 (Python 코드의 unwrap과 insert_after를 재현)
    novelContentElement.find('p').each((_, p) => {
      const text = $(p).text().trim();
      $(p).replaceWith(`${text}\n\n`); // <p> 태그를 제거하고 텍스트 뒤에 줄바꿈 추가
    });
    
    const novelContent = $('#novel_content').text().trim();

    // 파일 저장
    const filePath = path.join(novelPath, `${title}.txt`);
    fs.writeFileSync(filePath, novelContent, 'utf-8');
    console.log(`${title} ✅`);
  } catch (error) {
    console.error(`Chapter crawling failed ❌: title: ${title} | error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// 랜덤 대기 시간 (4~7초)
function randomDelay() {
  const delay = Math.floor(Math.random() * (7000 - 4000 + 1)) + 4000; // 4000ms ~ 7000ms
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// 모든 챕터를 순차적으로 스캔
async function scanAllChapters(chapterList, headers, novelPath) {
  for (const chapter of chapterList) {
    await scanChapter(chapter, headers, novelPath);
    await randomDelay(); // 랜덤 대기 시간 추가
  }
  console.log('All chapters scanned successfully 🚀');
}

module.exports = { getListHtml, parseList, scanChapter, scanAllChapters };