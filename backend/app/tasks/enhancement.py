"""Celery Tasks for AI Enhancement"""

from celery import Task
from pathlib import Path
import cv2
import numpy as np
from ..celery_config import celery_app
from ..config import settings

# Global model instance (loaded once per worker)
model = None

class EnhancementTask(Task):
    """Base task class that initializes model"""
    
    def __call__(self, *args, **kwargs):
        global model
        if model is None:
            print("Loading Real-ESRGAN model...")
            from ..models.realesrgan import RealESRGANModel
            model = RealESRGANModel(str(settings.MODELS_DIR))
            print("Model loaded successfully")
        return self.run(*args, **kwargs)

@celery_app.task(
    base=EnhancementTask,
    bind=True,
    name="enhance_image",
    max_retries=3,
    default_retry_delay=60
)
def enhance_image_task(self, job_id: str, input_path: str):
    """
    Enhance image using Real-ESRGAN
    
    Args:
        job_id: Unique job identifier
        input_path: Path to input image
    
    Returns:
        dict: Processing result with output path
    """
    from ..utils.metrics import calculate_metrics
    
    try:
        # Update state: Starting
        self.update_state(
            state="PROCESSING",
            meta={"progress": 0, "stage": "Loading image"}
        )
        
        # Load image
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Failed to load image: {input_path}")
        
        original_size = img.shape[:2]
        print(f"Processing {job_id}: {original_size[1]}x{original_size[0]}")
        
        # Update state: Enhancing
        self.update_state(
            state="PROCESSING",
            meta={"progress": 25, "stage": "Enhancing with Real-ESRGAN"}
        )
        
        # Enhance using Real-ESRGAN (this takes time)
        enhanced = model.enhance(img, outscale=settings.SCALE)
        
        # Update state: Calculating metrics
        self.update_state(
            state="PROCESSING",
            meta={"progress": 75, "stage": "Calculating quality metrics"}
        )
        
        # Calculate real quality metrics
        metrics = calculate_metrics(img, enhanced)
        
        # Save result
        output_path = settings.PROCESSED_DIR / f"{job_id}_enhanced.jpg"
        cv2.imwrite(
            str(output_path),
            enhanced,
            [cv2.IMWRITE_JPEG_QUALITY, 95]
        )
        
        enhanced_size = enhanced.shape[:2]
        print(f"Completed {job_id}: {enhanced_size[1]}x{enhanced_size[0]}")
        
        # Clean up upload file
        Path(input_path).unlink(missing_ok=True)
        
        return {
            "status": "completed",
            "job_id": job_id,
            "output_path": str(output_path),
            "original_size": f"{original_size[1]}x{original_size[0]}",
            "enhanced_size": f"{enhanced_size[1]}x{enhanced_size[0]}",
            "metrics": metrics
        }
    
    except Exception as e:
        # Clean up on error
        Path(input_path).unlink(missing_ok=True)
        
        # Update state: Failed
        self.update_state(
            state="FAILURE",
            meta={"error": str(e), "job_id": job_id}
        )
        
        print(f"Failed {job_id}: {str(e)}")
        raise
