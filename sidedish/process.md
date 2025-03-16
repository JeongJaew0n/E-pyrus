이런 쓰레기같은 맥북 도대체 뭐 한글로 제대로 되는 게 없다. 영어를 배우던가 해야지 원.

# 작업 내용
1. how to send request in python?
pip3 install requests

2. how to convert response.text to html?
pip3 install beautifulsoup4

3. ui
tkinter

4. create execution file
mac
- pip3 install py2app
- create setup.py
- rm -rf build dist && python setup.py py2app
- if error: codesign --force --deep --sign - dist/sidedish.app
이 방법은 안됨.

mac version 2
- pip3 install pyinstaller
- rm -rf build dist && pyinstaller main.py

# Erros
### File exists Error
in `from setuptools import setup`, setuptools have to use 70.3.0 version

### RuntimeError: Cannot sign bundle ~~
실행 시켜서 에러 확인: `dist/sidedish.app/Contents/MacOS/sidedish`
최신 mac 환경에서 `/System/Library/Frameworks/Carbon.framework` 라이브러리를 py2app에 자동으로 제공해주지 않음.