# 작업 내용
1. how to send request in python?
pip3 install requests

2. how to convert response.text to html?
pip3 install beautifulsoup4

3. ui
간단하게 처리하기 위해 tkinter 사용/

4. create execution file
mac
- pip3 install py2app
- create setup.py
- rm -rf build dist && python setup.py py2app
- if error: codesign --force --deep --sign - dist/sidedish.app
이 방법은 안됨.

mac version 2
- pip3 install pyinstaller
- 이거 하면 바로 실행되긴 하는데 아직 아님: rm -rf build dist && pyinstaller main.py
- spec 파일 생성: `pyi-makespec --onefile sidedish.py`
    - sepc 파일에서 version 명시, console(terminal) 실행여부, 결과물 파일 이름 지정 가능.(sepc 파일 참고)
- 최종 빌드: `rm -rf build dist && pyinstaller stable.spec`
- 참고 사항: spec 파일에 exe 말고 app 을 선언해줘야 app 파일이 생성됨.

# Erros

### RuntimeError: Cannot sign bundle ~~
문제 상황:
py2app 으로 빌드시 아래 에러들이 발생.
- File exists Error: setuptools 버전을 70.3.0 으로 낮추면 해결.
- 실행 시켜서 에러 확인: `dist/sidedish.app/Contents/MacOS/sidedish`
- 최신 mac 환경에서 `/System/Library/Frameworks/Carbon.framework` 라이브러리를 py2app에 자동으로 제공해주지 않음.
- code sign 문제

해결: pyinstaller 로 변경 