import os
import shutil

base_dir = r'C:/Users/pc/Desktop/Plan quán nước/sam-mix-planner'
pub_dir = os.path.join(base_dir, 'public')
dist_dir = os.path.join(base_dir, 'dist')

for img in ['oc_buou_nhoi_thit.jpg', 'vu_heo_dau_bap.jpg', 'long_bo_sua_nuong.jpg']:
    src = os.path.join(pub_dir, img)
    dst = os.path.join(dist_dir, img)
    if os.path.exists(src):
        shutil.copy(src, dst)
        print(f"Copied {img} to dist")

