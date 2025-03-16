import os
from bs4 import BeautifulSoup
import cloudscraper
import requests;
import time

folder_path = "results"
# file_path = os.path.join(folder_path, file_name)

proxy_url = "54.248.238.110:80"

# 목록 스캔
def getListHtml(url, headers, saveFile:bool = False):
    response = requests.get(url, headers=headers)

    if response.ok:
        soup = BeautifulSoup(response.text, "html.parser")

        # mkdir처럼 동작. exist_ok가 false일 경우 폴더가 이미 존재하면 에러 발생. default값이 false임.
        os.makedirs(folder_path, exist_ok=True)
        result = soup.prettify()
        if saveFile:
            list_path = os.path.join(folder_path, "list.html")
            with open(list_path, "w") as file:
                file.write(result)
            print(f"File created at: {list_path}")

        print("List crawling completed ✅")
        return result

    else:
        print(f"List crawling failed ❌: {response.status_code} ")

# 파일 읽기
def readFile(path):
    with open(path, "r") as file:
        content = file.read()
    return content

class Chapter:
    def __init__(self, title: str, link: str):
        self.title = title
        self.link = link

    def __str__(self):
        return f"{self.title}: {self.link}\n"
    
    def __iter__(self):
        return iter((self.title, self.link))

# todo: novel_path가 global인 건 좋지 않음.
novel_path: str
# list html을 파싱해서 링크와 제목을 빈환.
def parseList(listHtml):
    soup = listHtml if isinstance(listHtml, BeautifulSoup) else BeautifulSoup(listHtml, "html.parser")

    # 노벨 제목
    title = soup.select_one(".view-title .view-content span b").get_text(strip=True)
    global novel_path
    novel_path = os.path.join(folder_path, title)
    os.makedirs(novel_path, exist_ok=True)
    
    subject_a_tags = soup.select(".wr-subject a")
    chapter_list: list[Chapter] = []
    for a_tag in subject_a_tags:
        # 제목만 남기기 위해 span 태그 삭제
        [span.decompose() for span in a_tag.select("span")]
        chapter_list.append(Chapter(a_tag.get_text(strip=True), a_tag.get("href")))
    return chapter_list

# Chapter 하나를 스캔.
def scanCapter(ch: Chapter, headers):
    title, link = ch

    response = requests.get(link, headers=headers)
    if response.ok:
        soup = BeautifulSoup(response.text, "html.parser")
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

def scanAllChapter(chapter_list: list[Chapter], headers, time_wait = 5, waitFunction: callable = None):
        for ch in chapter_list:
            scanCapter(ch, headers=headers)
            if waitFunction:
                waitFunction()
            else:
                time.sleep(time_wait)
            
        print("All chapter crawling completed 🚀")


# Chapter 스캔 테스트용
def scanCapterTest(ch: Chapter):
    title, link = ch

    file = readFile("TestChapter.html")
    
    soup = BeautifulSoup(file, "html.parser")
    with open(f"{os.path.join("results/", title)}.txt", "w") as file:
        novel_soup = soup.select_one('#novel_content')
        for a in novel_soup.find_all("p"):
            a.insert_after("\n")
            a.insert_after("\n")
            a.unwrap()
        file.write(novel_soup.getText().strip())
    print(f"{title} ✅" )