from PIL import Image
import os

frames_dir = "frames"
ascii_output_dir = "ascii_frames"

if not os.path.exists(ascii_output_dir):
    os.makedirs(ascii_output_dir)

CHAR_LIST = "@%#*+=-:. "
WIDTH = 80

def convert_image_to_ascii(image, width=WIDTH):
    image = image.convert("L")  # grayscale
    w, h = image.size
    aspect_ratio = h / w
    new_height = int(aspect_ratio * width * 0.55)
    image = image.resize((width, new_height))

    pixels = image.getdata()
    chars = "".join(CHAR_LIST[min(pixel // 25, len(CHAR_LIST) - 1)] for pixel in pixels)
    ascii_image = "\n".join(chars[i:i+width] for i in range(0, len(chars), width))
    return ascii_image


frame_files = sorted(f for f in os.listdir(frames_dir) if f.endswith(".png"))

for i, filename in enumerate(frame_files):
    path = os.path.join(frames_dir, filename)
    image = Image.open(path)
    ascii_str = convert_image_to_ascii(image)
    with open(os.path.join(ascii_output_dir, f"frame_{i:04}.txt"), "w") as f:
        f.write(ascii_str)

print("모든 프레임을 ASCII로 변환 완료.")
