from setuptools import setup

# 이 파일은 사용하지 않습니다.
# py2app 이 너무 많은 에러가 발생하고 결국 해결하지 못했음.

OPTIONS = {
    "argv_emulation": True, # 명령줄 인수 전달
    "includes": ["pyobjc-framework-Carbon"],
    "packages": [
        "tkinter",
        "crawler",
        "requests",
        "bs4"
    ]
    }

setup(
    name="sidedish",
    version="1.0.0",
    app=["main.py"],

    options={"py2app": OPTIONS},
    # 설치 시 의존성
    setup_requires=["py2app"],
)