import os
import time

ascii_dir = "ascii_frames"
frame_files = sorted(f for f in os.listdir(ascii_dir) if f.endswith(".txt"))

try:
    while True:
        for frame_file in frame_files:
            with open(os.path.join(ascii_dir, frame_file), "r") as f:
                frame = f.read()
            print("\033[H\033[J", end="")  # 터미널 클리어 (Mac/Linux)
            print(frame)
            time.sleep(0.033)  # 약 30fps
except KeyboardInterrupt:
    print("\n애니메이션 종료")
