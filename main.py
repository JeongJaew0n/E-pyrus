import pytesseract
from PIL import ImageGrab

# Capture screen (adjust bbox to target specific area)
img = ImageGrab.grab(bbox=(100, 100, 500, 500))  # Adjust coordinates as needed

# OCR processing
text = pytesseract.image_to_string(img, lang="eng")  # Use 'kor' for Korean text
print(text)

from pynput import mouse

start_pos = None  # Stores the starting point of the drag

def on_click(x, y, button, pressed):
    global start_pos
    if pressed:
        start_pos = (x, y)  # Store the starting position
        print(f"Drag Start: {start_pos}")
    else:
        end_pos = (x, y)  # Get the end position
        print(f"Drag End: {end_pos}")
        print(f"Dragged Area: {start_pos} → {end_pos}")

# Start listening for mouse events
with mouse.Listener(on_click=on_click) as listener:
    listener.join()