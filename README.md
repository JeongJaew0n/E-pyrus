# cheese

소설 사이트에서 챕터를 크롤링하여 텍스트 파일로 저장하는 도구.

## 구현체

### 1. Chrome Extension (현재 메인) — `cheese-extension/`

Cloudflare 보안을 우회하기 위해 사용자의 실제 브라우저 세션을 활용하는 Chrome Extension.

#### 설치

1. Chrome에서 `chrome://extensions/` 접속
2. 개발자 모드 ON
3. "압축해제된 확장 프로그램을 로드합니다" → `cheese-extension/` 폴더 선택

#### 사용법

1. 대상 사이트에 먼저 방문하여 Cloudflare 통과
2. 3가지 방식으로 사용 가능:
   - **팝업**: 확장 프로그램 아이콘 클릭
   - **사이드패널**: `booktoki*.com/novel/*` 페이지에서 우측 🧀 버튼 클릭
   - **새 탭**: 팝업에서 ⧉ 버튼 클릭 (폴더 선택 기능 사용 시 필요)

#### 파일 구조

```
cheese-extension/
├── manifest.json    # MV3 매니페스트
├── popup.html       # UI
├── popup.js         # 크롤링 로직 전체
├── popup.css        # 스타일
├── content.js       # 사이트 내 플로팅 버튼 + 사이드 패널 주입
└── content.css      # 플로팅 버튼 + 사이드 패널 스타일
```

#### 아키텍처

- **Manifest V3**, 외부 라이브러리 없음
- 모든 로직이 `popup.js`에 집중
- `chrome.tabs` + `chrome.scripting.executeScript()`로 DOM 직접 접근 (Puppeteer/Cheerio 대체)
- `chrome.downloads` 또는 File System Access API로 파일 저장
- `chrome.storage.local`로 설정 저장
- 쿠키(PHPSESSID, cf_clearance)는 브라우저에서 자동 처리 → 수동 입력 불필요

#### 3가지 모드

| 모드 | 진입 방식 | 폴더 선택 | 비고 |
|---|---|---|---|
| popup | 확장 아이콘 클릭 | 불가 (새 탭으로 전환) | 팝업은 포커스 잃으면 닫힘 |
| tab | 팝업에서 ⧉ 클릭 | `showDirectoryPicker()` 정상 동작 | 폴더 지정 필요 시 사용 |
| sidepanel | 사이트에서 🧀 클릭 | `showDirectoryPicker()` 정상 동작 | URL 자동 입력 |

#### HTML 셀렉터 (사이트 구조)

| 대상 | 셀렉터 | 위치 |
|---|---|---|
| 소설 제목 | `.view-title .view-content span b` | 목록 페이지 |
| 챕터 링크 | `.wr-subject a` | 목록 페이지 |
| 챕터 본문 | `#novel_content` | 챕터 페이지 |

#### 크롤링 플로우

1. 백그라운드 탭 생성 → 목록 URL 로드
2. `executeScript`로 제목 + 챕터 목록 추출
3. 챕터 목록 reverse (사이트는 최신순, 오름차순으로 변환)
4. Range/Jump 계산: `startIndex = jumpNumber - rangeStart`
5. 각 챕터: 탭 이동 → 본문 추출 → txt 저장 → 4~7초 랜덤 딜레이
6. 완료 시 탭 닫기

---

### 2. Electron App (레거시) — 루트 파일들

Puppeteer + Cheerio 기반 데스크톱 앱. Cloudflare 문제로 Chrome Extension으로 전환됨.

#### 파일

- `main.js` — Electron 메인 프로세스, IPC 핸들러
- `renderer.js` — 프론트엔드 로직
- `index.html` — UI
- `crawler.js` — Puppeteer/Cheerio 크롤링 로직
- `ui.js` — CLI 대안 인터페이스

#### 실행 (참고용)

```bash
cd cheese
npm install
npm start
```

Node.js `20.18.1` 이상 필요.

---

## 기타 파일

- `dev_sample/list_sample.html` — 사이트 HTML 구조 샘플 (셀렉터 테스트용)
- `results/` — 크롤링 결과 저장 폴더 (Electron용)
- `debug_output*.html` — 디버깅용 HTML 덤프

## 주의 사항

- 사이트 도메인 번호가 변경될 수 있음 (booktoki468 → 469 → ...)
- 챕터 간 4~7초 랜덤 딜레이는 속도 제한 방지용, 줄이면 차단 위험
- popup 모드에서는 팝업을 닫으면 크롤링 중단됨
- 첫 다운로드 시 Chrome이 "여러 파일 다운로드" 허용을 물을 수 있음
