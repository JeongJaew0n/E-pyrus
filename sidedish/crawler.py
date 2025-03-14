import os
from bs4 import BeautifulSoup
import requests;

folder_path = "results"
file_name = "list.html"
file_path = os.path.join(folder_path, file_name)

# 목록 스캔
def getListHtml(url, saveFile:bool = False):
    response = requests.get(url, headers=headers)

    if response.ok:
        soup = BeautifulSoup(response.text, "html.parser")

        # mkdir처럼 동작. exist_ok가 false일 경우 폴더가 이미 존재하면 에러 발생. default값이 false임.
        os.makedirs(folder_path, exist_ok=True)
        result = soup.prettify()
        if saveFile:
            with open(file_path, "w") as file:
                file.write(result)
            print(f"File created at: {file_path}")

        print("List crawling completed ✅")
        return result

    else:
        print(response.text)

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

# list html을 파싱해서 링크와 제목을 빈환.
def parseList(listHtml):
    soup = listHtml if (isinstance(listHtml, BeautifulSoup)) else soup = BeautifulSoup(listHtml, "html.parser")

    # 노벨 제목
    title = soup.select_one(".view-title .view-content span b").get_text(strip=True)
    os.makedirs(file_path + title, exist_ok=True)
    
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
        # with open("results/" + title + ".txt", "w") as file:
        #     file.write(soup.select_one('#novel_content').get_text().strip())
        print(f"complete: {title}" )

    else:
        print(response.status_code)
    

PHPSESSID = "o10rgri979mfp81vvas56e7kge7dbing7m3m7vv5fvlsjsu0l8ke9uho99ikm0gf"
el = "bm92ZWw%3D; HstCfa4678477=1741875018404"
headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6,ja;q=0.5",
    "Cookie": "PHPSESSID=vanc8rvknnmoc7tb53c0a9f6qi5vs2i1i2m89vuitd0vv6jac8hd8k31jehag13i; HstCfa4678477=1741783292412; HstCmu4678477=1741783292412; c_ref_4678477=https%3A%2F%2Fwww.xn--h10bx0wsvp.net%2F; e1192aefb64683cc97abb83c71057733=bm92ZWw%3D; HstCnv4678477=4; HstCns4678477=8; cf_clearance=yjP86XyEj8f8yBlCr2U8VPPi052g0EQv2iOiN2hDWY0-1741957326-1.2.1.1-vBpfFVL21sjFCGs0VcvUW2zX24Fr6Mv1BN9SR3Cq.Q4NSw2Ym4cjS43USgwUe7r7UmoFSlpQEGp61H0dCI6sDV.fBU8rgD183oxu4fqL_urL_qzL.kGa0vvzXb.hwaqMBcoMVArGJElQu3L9xGAx_oj4fLPJGFvlBkECvs4zgmcJk59C_sDMYV9QjQn.ab3._JTzlWfHqUmTIQSYLx9Gz_0n3BnW3A1L_Ukdbec2HedCxBG22FTiF6UHP_ZJ037idWF0ZHZKN.0IEqUdnqX6Ggb3exp5_p1dm20rRRqnSiDjXerAWx0z2uVLjXcpBSlzXMYjcAOGYLyBwDXY1d.Up6NZ64R1bhQE07.t3PfSdf3RClB88_vF0PUdTySTm31rVCKNGddN6d63k4_WTnh_lhn7OJ0kjtQOmLd1q4a3rCw; HstCla4678477=1741957329938; HstPn4678477=2; HstPt4678477=41",
    "Referer": "https://booktoki468.com/bbs/captcha.php?bo_table=novel&wr_id=18081374&book=%EC%9D%BC%EB%B0%98%EC%86%8C%EC%84%A4",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
}


listHtml = readFile(file_path)
chapter_list = parseList(listHtml)
scanCapter(chapter_list[0], headers)

