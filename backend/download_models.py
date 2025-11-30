#!/usr/bin/env python3
"""Download AI models during Docker build"""

import os
import urllib.request
from pathlib import Path

MODELS_DIR = Path("/app/models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODELS = {
    "RealESRGAN_x4plus.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
    "GFPGANv1.4.pth": "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth",
    "detection_Resnet50_Final.pth": "https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth",
}

def download_file(url: str, dest: Path):
    if dest.exists():
        print(f"✓ {dest.name} already exists ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        return
    
    print(f"Downloading {dest.name}...")
    
    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(downloaded / total_size * 100, 100) if total_size > 0 else 0
        print(f"\r  Progress: {percent:.1f}%", end='')
    
    try:
        urllib.request.urlretrieve(url, dest, reporthook=progress)
        print(f"\n✓ Downloaded {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
    except Exception as e:
        print(f"\n⚠ Failed to download {dest.name}: {e}")
        # Don't fail the build, models can be downloaded later

if __name__ == "__main__":
    print("Downloading AI models...")
    print(f"Target directory: {MODELS_DIR}")
    
    for filename, url in MODELS.items():
        download_file(url, MODELS_DIR / filename)
    
    print("\n✅ Model download complete")
