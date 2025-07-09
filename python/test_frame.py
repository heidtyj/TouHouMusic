import os

ascii_dir = "ascii_frames"
frame_files = sorted(f for f in os.listdir(ascii_dir) if f.endswith(".txt"))

with open(os.path.join(ascii_dir, frame_files[0]), "r") as f:
    ascii_frame = f.read()

print(ascii_frame)
