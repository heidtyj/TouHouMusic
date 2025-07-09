import os
import json

ascii_dir = "ascii_frames"  # 프레임 텍스트 파일들 폴더명
output_json = "ascii_frames.json"  # 저장할 JSON 파일명

frames = []
frame_files = sorted(f for f in os.listdir(ascii_dir) if f.endswith(".txt"))

for fname in frame_files:
    with open(os.path.join(ascii_dir, fname), "r") as f:
        frames.append(f.read())

with open(output_json, "w") as f:
    json.dump(frames, f)

print(f"총 {len(frames)}개의 프레임을 {output_json}에 저장 완료")
