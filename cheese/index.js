const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true }); // 백그라운드에서 실행
    const page = await browser.newPage();

    // 요청 헤더 설정
    await page.setExtraHTTPHeaders({
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7',
        'cache-control': 'max-age=0',
        'cookie': 'PHPSESSID=28qd61nh7e4brikfvat49aj2jhcg4t01l5qf5j0c0ih5ejejhjee9s3o832s4p24; cf_clearance=REy7SnD2OZTF4AMFs3nlr01mo94AqFMCbqk7srAT568-1760176632-1.2.1.1-uWYVz3oV2nKBWprzPaKpbweDLTsiXpsy.uUpbJpBusWkMAScNnRg4TsqjJH2Ty9G6fVRIPjAOcsJQ.y.7aTW.xlcfvjpZqb95Du3zbWAkD3zMwEDxNn4JgOFMHlQbCJmqLHAMv82ABUkaDJZDfjp8va1dRd1ZFeiKKBOQ_reVYKAa7lxrroskpff204j_KhIDdrpwmsm6yl4Ntl139lT1PGg1GqOk5FD3bgNkRBqeNO7Y4Ejnivyfgh3BHcyeIRS; e1192aefb64683cc97abb83c71057733=bm92ZWw%3D',
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
    });

    // 브라우저에서 가져온 쿠키 값 설정
    const cookies = [
        {
            name: 'cf_clearance',
            value: 'REy7SnD2OZTF4AMFs3nlr01mo94AqFMCbqk7srAT568-1760176632-1.2.1.1-uWYVz3oV2nKBWprzPaKpbweDLTsiXpsy.uUpbJpBusWkMAScNnRg4TsqjJH2Ty9G6fVRIPjAOcsJQ.y.7aTW.xlcfvjpZqb95Du3zbWAkD3zMwEDxNn4JgOFMHlQbCJmqLHAMv82ABUkaDJZDfjp8va1dRd1ZFeiKKBOQ_reVYKAa7lxrroskpff204j_KhIDdrpwmsm6yl4Ntl139lT1PGg1GqOk5FD3bgNkRBqeNO7Y4Ejnivyfgh3BHcyeIRS', // 브라우저에서 가져온 cf_clearance 값
            domain: 'booktoki468.com',
            path: '/',
            httpOnly: false,
            secure: true,
        },
        {
            name: 'PHPSESSID',
            value: '28qd61nh7e4brikfvat49aj2jhcg4t01l5qf5j0c0ih5ejejhjee9s3o832s4p24', // 브라우저에서 가져온 PHPSESSID 값
            domain: 'booktoki468.com',
            path: '/',
            httpOnly: true,
            secure: true,
        },
        // 필요한 추가 쿠키를 여기에 추가
    ];

    await page.setCookie(...cookies);

    // URL 열기
    const url = 'https://booktoki468.com/novel/1793238?stx=%ED%95%99%EC%82%AC%EC%8B%A0%EA%B3%B5&sst=as_update&sod=desc';
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 페이지 HTML 가져오기
    const content = await page.content();
    console.log(content);

    // 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'screenshot.png' });

    // 브라우저 닫기
    await browser.close();
})();