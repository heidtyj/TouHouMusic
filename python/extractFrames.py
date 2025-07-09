import cv2
import os

video_path = 'video.mp4'
output_folder = 'frames'

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

cap = cv2.VideoCapture(video_path)
frame_count = 0

while True:
    success, frame = cap.read()
    if not success:
        break
    filename = f"{frame_count:06}.png"
    filepath = os.path.join(output_folder, filename)
    cv2.imwrite(filepath, frame)
    frame_count += 1

cap.release()
print(f"Saved {frame_count} frames to {output_folder}")
