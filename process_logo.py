import cv2
import numpy as np
from PIL import Image
import sys

sys.stdout.reconfigure(encoding='utf-8')

img_path = r"c:\Users\pc\Desktop\Plan quán nước\com-tam-suon-nuong-app\public\logo_gymer.jpg"
out_path = r"c:\Users\pc\Desktop\Plan quán nước\com-tam-suon-nuong-app\public\logo_bw.png"

# Read with PIL
pil_img = Image.open(img_path).convert("L")

# Resize width to 350px (good for thermal)
w_percent = 350 / float(pil_img.size[0])
h_size = int((float(pil_img.size[1]) * float(w_percent)))
pil_img = pil_img.resize((350, h_size), Image.Resampling.LANCZOS)

# Convert to numpy array for thresholding/dithering
img_arr = np.array(pil_img)

# Simple thresholding or dithering. Let's use simple OpenCV adaptive thresholding
# which works well for thermal receipts
thresh = cv2.adaptiveThreshold(img_arr, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5)

# Save
Image.fromarray(thresh).save(out_path)
print("Saved BW logo to", out_path)
