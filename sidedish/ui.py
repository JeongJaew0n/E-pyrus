import tkinter as tk
from tkinter import ttk

# Create the main window
root = tk.Tk()
root.title("Simple Tkinter UI")
root.geometry("300x200")

# Title label
title_label = tk.Label(root, text="Enter Details", font=("Arial", 14))
title_label.pack(pady=5)

# First input field
entry1_label = tk.Label(root, text="Input 1:")
entry1_label.pack()
entry1 = tk.Entry(root)
entry1.pack(pady=2)

# Second input field
entry2_label = tk.Label(root, text="Input 2:")
entry2_label.pack()
entry2 = tk.Entry(root)
entry2.pack(pady=2)

# Function to run when "Run" button is clicked
def run_action():
    print("Input 1:", entry1.get())
    print("Input 2:", entry2.get())

# Button Frame (for bottom-right alignment)
button_frame = tk.Frame(root)
button_frame.pack(side="bottom", pady=10, anchor="se")

# "Run" Button
run_button = tk.Button(button_frame, text="Run", fg="black", command=run_action)
run_button.pack(side="left", padx=5)

# "Exit" Button
exit_button = tk.Button(button_frame, text="Exit", command=root.quit)
exit_button.pack(side="right")

# Run the Tkinter event loop
root.mainloop()