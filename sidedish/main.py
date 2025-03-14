import requests
import os
from bs4 import BeautifulSoup

url = "https://booktoki468.com/novel/17799638?book=%EC%9D%BC%EB%B0%98%EC%86%8C%EC%84%A4"
headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "cookie": "PHPSESSID=vanc8rvknnmoc7tb53c0a9f6qi5vs2i1i2m89vuitd0vv6jac8hd8k31jehag13i; HstCfa4678477=1741783292412; HstCmu4678477=1741783292412; HstCnv4678477=1; c_ref_4678477=https%3A%2F%2Fwww.xn--h10bx0wsvp.net%2F; HstCns4678477=2; cf_clearance=QSomgLGuNWmgM4mO_Uo2qp8SyOcffIYyUo0HpUkGr74-1741785288-1.2.1.1-gf55ymGC2AWqoGjVkmfqAKBWnev6g8Mjr12I7dCQjQZme9uQhkJXPhTCzqllWSeKOTbkHZlVGaOpCX4RFAvige5fRTZQ8LJn.LGi_UPgWn_q42JNgSlbarKsdfGIYDH94s5rQeqV7PVQuI4qv9NfU_BEktXcgFqyqFn9iCUF8p6BHlKPmstmP.DIH00O2Ok8gtmUl9k.4JTVAFYpJ9zcotANp_veCQfA7z.p4bw.xfnQA63ZwITDeBGJ.8xnxA8etvZk8aSsL8PO3jkomifd4LbP6M9SW7fyM1dlUYtHh1RJip16bZrNvFWS4M4Hx_LmfSYRcm8ur3hnWbsMTMQXlo4b19d3aTvz45dxXUkNNbmBgfCyxNxJ5uzqnuY1inAYrv1LemuTdu_3N403tyC2Gs7YagA.UXmswT4.jL8L1DY; e1192aefb64683cc97abb83c71057733=bm92ZWw%3D; HstCla4678477=1741785505010; HstPn4678477=29; HstPt4678477=29",
    "if-modified-since": "Wed, 12 Mar 2025 13:16:47 GMT",
    "priority": "u=0, i",
    "referer": "https://booktoki468.com/bbs/captcha.php?bo_table=novel&wr_id=17799638&book=%EC%9D%BC%EB%B0%98%EC%86%8C%EC%84%A4",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
}

