import os
from bs4 import BeautifulSoup
import cloudscraper
import time
import zstandard as zstd
import ssl

folder_path = "results"

# 목록 스캔
import ssl

def getListHtml(url, headers, saveFile: bool = False):
    # SSLContext 생성 및 설정
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False  # check_hostname 비활성화
    ssl_context.verify_mode = ssl.CERT_NONE  # SSL 검증 비활성화

    # cloudscraper 생성
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'darwin',
            'mobile': False
        }
    )
    scraper.ssl_context = ssl_context  # 커스텀 SSLContext 설정

    try:
        response = scraper.get(url, headers=headers)
        print(f"HTTP Status Code: {response.status_code}")  # 상태 코드 출력
        if response.status_code == 200:
            print("Response Headers:", response.headers)  # 응답 헤더 출력
            print("Response Content (first 500 chars):", response.text[:500])  # 응답 내용 일부 출력

            soup = BeautifulSoup(response.content, "html.parser")
            if saveFile:
                os.makedirs(folder_path, exist_ok=True)
                with open(os.path.join(folder_path, "list.html"), "w", encoding="utf-8") as file:
                    file.write(soup.prettify())
            print("List crawling completed ✅")
            return soup
        else:
            print(f"List crawling failed ❌: {response.status_code}")
            print(f"Response Content (first 500 chars): {response.text[:500]}")  # 실패 시 응답 내용 출력
            return None
    except Exception as e:
        print(f"An error occurred in getListHtml: {e}")
        return None

    
def parseList(listHtml):
    if listHtml is None:
        print("Error: listHtml is None. Cannot parse.")
        return []

    soup = listHtml if isinstance(listHtml, BeautifulSoup) else BeautifulSoup(listHtml, "html.parser")

    # 노벨 제목
    title = soup.select_one(".view-title .view-content span b").get_text(strip=True)
    global novel_path
    novel_path = os.path.join(folder_path, title)
    os.makedirs(novel_path, exist_ok=True)
    
    subject_a_tags = soup.select(".wr-subject a")
    chapter_list = []
    for a_tag in subject_a_tags:
        # 제목만 남기기 위해 span 태그 삭제
        [span.decompose() for span in a_tag.select("span")]
        chapter_list.append((a_tag.get_text(strip=True), a_tag.get("href")))
    return chapter_list

# Chapter 하나를 스캔.
def scanCapter(ch, headers):
    title, link = ch

    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'darwin',
            'mobile': False
        }
    )
    response = scraper.get(link, headers=headers)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        with open(f"{os.path.join(novel_path, title)}.txt", "w") as file:
            novel_soup = soup.select_one('#novel_content')
            for a in novel_soup.find_all("p"):
                a.insert_after("\n")
                a.insert_after("\n")
                a.unwrap()
            file.write(novel_soup.getText().strip())
        print(f"{title} ✅" )

    else:
        print(f"Chapter crawling failed ❌: title:{title} | status code: {response.status_code} ")