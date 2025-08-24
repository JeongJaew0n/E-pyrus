import tkinter as tk
import crawler
import sys
import random
import json
from dataclasses import dataclass
import os


def start_ui():
    url: str
    PHPSESSID: str
    cf_clearance: str

    stop: bool = False

    # Create the main window
    root = tk.Tk()
    root.title("Simple Tkinter UI")
    root.geometry("600x600")

    # Title label
    title_label = tk.Label(root, text="Enter Details", font=("Arial", 14))
    title_label.pack(pady=5)

    # Input - url
    url_label = tk.Label(root, text="url")
    url_label.pack()
    url_input = tk.Entry(root)
    url_input.pack(pady=3)

    # Input - PHPSESSID
    PHPSESSID_label = tk.Label(root, text="PHPSESSID")
    PHPSESSID_label.pack()
    PHPSESSID_input = tk.Entry(root)
    PHPSESSID_input.pack(pady=3)

    # Input - cf_clearance
    cf_clearance_label = tk.Label(root, text="cf_clearance")
    cf_clearance_label.pack()
    cf_clearance_input = tk.Entry(root)
    cf_clearance_input.pack(pady=3)

    # --- 인덱스 입력 UI 재배치 ---
    index_frame = tk.Frame(root)
    index_frame.pack(pady=3)

    # 첫 번째 줄: max_index, current_index
    max_index_label = tk.Label(index_frame, text="max_index")
    max_index_label.grid(row=0, column=0, padx=2, pady=2)
    max_index_input = tk.Entry(index_frame, width=8)
    max_index_input.grid(row=0, column=1, padx=2, pady=2)

    current_index_label = tk.Label(index_frame, text="current_index")
    current_index_label.grid(row=0, column=2, padx=2, pady=2)
    current_index_input = tk.Entry(index_frame, width=8)
    current_index_input.grid(row=0, column=3, padx=2, pady=2)

    # 두 번째 줄: start_index, end_index
    start_index_label = tk.Label(index_frame, text="start_index")
    start_index_label.grid(row=1, column=0, padx=2, pady=2)
    start_index_input = tk.Entry(index_frame, width=8)
    start_index_input.grid(row=1, column=1, padx=2, pady=2)

    end_index_label = tk.Label(index_frame, text="end_index")
    end_index_label.grid(row=1, column=2, padx=2, pady=2)
    end_index_input = tk.Entry(index_frame, width=8)
    end_index_input.grid(row=1, column=3, padx=2, pady=2)

    # --- 계산 버튼 추가 ---
    def calc_action():
        try:
            max_val = int(max_index_input.get())
            current_val = int(current_index_input.get())
            result = max_val - current_val
            print(f"max_index - current_index = {result}")
        except ValueError:
            print("숫자를 올바르게 입력하세요.")

    calc_button = tk.Button(index_frame, text="계산", command=calc_action)
    calc_button.grid(row=0, column=4, rowspan=2, padx=8, pady=2, sticky="ns")

    # Function to run when "Run" button is clicked
    def run_action():
        stop = False
        url = url_input.get()
        PHPSESSID = PHPSESSID_input.get()
        cf_clearance = cf_clearance_input.get()

        max_index = max_index_input.get()
        current_index = current_index_input.get()
        
        start_index = start_index_input.get()
        if start_index == "":
            start_index = 0
        end_index = end_index_input.get()
        if end_index == "":
            end_index = 0

        id = 17799638

        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6,ja;q=0.5",
            "Cookie": f"PHPSESSID={PHPSESSID}; cf_clearance={cf_clearance}",
            "Referer": "https://booktoki468.com/novel/1793238?sst=as_view&sod=desc&yoil=%EC%99%84%EA%B2%B0&book=%EC%99%84%EA%B2%B0%EC%86%8C%EC%84%A4",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        }

        listHtml = crawler.getListHtml(url=url, headers=headers)
        chapter_list = crawler.parseList(listHtml)
        scanRootAfter(chapter_list, headers, int(start_index), int(end_index))
        
        # crawler.scanAllChapter(chapter_list, headers, random.randrange(5000, 11000) / 1000)

    # time.sleep 을 쓰면 ui가 멈추므로 root.after를 사용
    def scanRootAfter(chapter_list: list, headers, index: int = 0, end_index: int = 0):
        if (end_index != 0 and index >= end_index):
            print("End index reached, stopping the scan.")
            return
        if (index == len(chapter_list)):
            print("All chapter crawling completed 🚀")
            return
        crawler.scanCapter(chapter_list[index], headers)
        randomTime = random.randrange(2000, 5000)
        print(f"Wait for seconds: {randomTime/1000} | Next Index: {index + 1}")
        if (stop):
            print("Stop!")
            return
        root.after(randomTime, scanRootAfter, chapter_list, headers, index + 1)

    def stop_action():
        stop = True

    @dataclass
    class LocalData:
        url: str
        PHPSESSID: str
        cf_clearance: str
        start_index: str

    local_storage_json = "data.json"
    def save_action():
        data = {
            "url": url_input.get(),
            "PHPSESSID": PHPSESSID_input.get(),
            "cf_clearance": cf_clearance_input.get(),
            "start_index": start_index_input.get()
        }

        with open(local_storage_json, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)
        print("File has been saved successfully ✅")

    def load_action():
        try:
            if not os.path.exists(local_storage_json):
                raise FileNotFoundError(f"File not found: {local_storage_json}")

            with open(local_storage_json, "r", encoding="utf-8") as file:
                loaded_data = json.load(file)
                
                set_data(LocalData(**loaded_data))
        except:
            print(f"The file '{local_storage_json}' does not exist.")

    def set_data(localData: LocalData):
        url_input.delete(0, tk.END)
        url_input.insert(0, localData.url)
        PHPSESSID_input.delete(0, tk.END)
        PHPSESSID_input.insert(0, localData.PHPSESSID)
        cf_clearance_input.delete(0, tk.END)
        cf_clearance_input.insert(0, localData.cf_clearance)
        start_index_input.delete(0, tk.END)
        start_index_input.insert(0, localData.start_index)

    # Button Frame (for bottom-right alignment)
    button_frame = tk.Frame(root)
    button_frame.pack(side="bottom", pady=10, anchor="se")

    # "Stop" Button
    stop_button = tk.Button(button_frame, text="Stop", command=stop_action)
    stop_button.pack(side="left", padx=5)

    # "Save" Button
    save_button = tk.Button(button_frame, text="Save", command=save_action)
    save_button.pack(side="left", padx=5)

    # "Load" Button
    load_button = tk.Button(button_frame, text="Load", command=load_action)
    load_button.pack(side="left", padx=5)

    # "Run" Button
    run_button = tk.Button(button_frame, text="Run", command=run_action)
    run_button.pack(side="left", padx=5)

    # "Exit" Button
    exit_button = tk.Button(button_frame, text="Exit", command=root.quit)
    exit_button.pack(side="right")

    # Text widget to display print output
    text_output = tk.Text(root, wrap="word", height=10, width=50)
    text_output.pack(pady=10)

    class PrintRedirector:
        """Redirect print() output to Tkinter Text widget"""
        def __init__(self, text_widget, root):
            self.text_widget = text_widget
            self.root = root

        def write(self, message):
            self.text_widget.insert(tk.END, message)  # Insert text at the end
            self.text_widget.see(tk.END)  # Auto-scroll to the bottom
            self.root.update_idletasks() # Force UI update after each print

        def flush(self):
            pass  # Needed for sys.stdout compatibility

    sys.stdout = PrintRedirector(text_output, root=root)

    # Run the Tkinter event loop
    root.mainloop()


