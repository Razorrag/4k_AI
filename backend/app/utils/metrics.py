"""Image Quality Metrics"""

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from skimage.metrics import peak_signal_noise_ratio as psnr

def calculate_metrics(original: np.ndarray, enhanced: np.ndarray) -> dict:
    """
    Calculate real quality metrics between original and enhanced images
    
    Args:
        original: Original image
        enhanced: Enhanced image
    
    Returns:
        dict: Quality metrics (PSNR, SSIM, sharpness)
    """
    
    # Resize enhanced to match original for comparison
    if original.shape != enhanced.shape:
        enhanced_resized = cv2.resize(
            enhanced,
            (original.shape[1], original.shape[0]),
            interpolation=cv2.INTER_AREA
        )
    else:
        enhanced_resized = enhanced
    
    # Calculate PSNR
    try:
        psnr_value = psnr(original, enhanced_resized, data_range=255)
    except Exception:
        psnr_value = 0.0
    
    # Calculate SSIM
    try:
        ssim_value = ssim(
            original,
            enhanced_resized,
            channel_axis=2,
            data_range=255
        )
    except Exception:
        ssim_value = 0.0
    
    # Calculate sharpness (Laplacian variance)
    gray_original = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
    gray_enhanced = cv2.cvtColor(enhanced_resized, cv2.COLOR_BGR2GRAY)
    
    sharpness_original = cv2.Laplacian(gray_original, cv2.CV_64F).var()
    sharpness_enhanced = cv2.Laplacian(gray_enhanced, cv2.CV_64F).var()
    
    sharpness_gain = 0.0
    if sharpness_original > 0:
        sharpness_gain = float(sharpness_enhanced / sharpness_original)
    
    return {
        "psnr": round(float(psnr_value), 2),
        "ssim": round(float(ssim_value), 4),
        "sharpness_gain": round(sharpness_gain, 2)
    }
