"""FastAPI Application (Port 38291)"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import aiofiles
import uuid
from pathlib import Path
from datetime import datetime
from .config import settings

app = FastAPI(
    title="AI Image Enhancer API",
    version="2.0.0",
    description="Real AI Image Enhancement with Real-ESRGAN"
)

# CORS - Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "port": settings.PORT,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload image and start enhancement"""
    
    # Validate extension
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    ext = file.filename.split(".")[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Invalid file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Validate size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > settings.MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE / 1024 / 1024
        raise HTTPException(400, f"File too large. Maximum: {max_mb}MB")
    
    if size == 0:
        raise HTTPException(400, "Empty file")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    upload_path = settings.UPLOAD_DIR / f"{job_id}.{ext}"
    
    try:
        async with aiofiles.open(upload_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(500, f"Failed to save file: {str(e)}")
    
    # Start Celery task (import here to avoid circular imports)
    try:
        from .tasks.enhancement import enhance_image_task
        task = enhance_image_task.delay(job_id, str(upload_path))
    except Exception as e:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(500, f"Failed to start processing: {str(e)}")
    
    return {
        "job_id": job_id,
        "task_id": task.id,
        "status": "queued",
        "message": "Image uploaded and queued for processing",
        "original_filename": file.filename,
        "file_size": size
    }

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    """Get job processing status"""
    
    # Check if result exists
    result_path = settings.PROCESSED_DIR / f"{job_id}_enhanced.jpg"
    
    if result_path.exists():
        return {
            "job_id": job_id,
            "status": "completed",
            "result_url": f"/api/result/{job_id}",
            "completed_at": datetime.fromtimestamp(result_path.stat().st_mtime).isoformat()
        }
    
    # Check if upload exists (still processing or failed)
    upload_files = list(settings.UPLOAD_DIR.glob(f"{job_id}.*"))
    
    if not upload_files:
        # Check if it was already processed and cleaned up
        if not result_path.exists():
            raise HTTPException(404, "Job not found")
    
    # Job is still processing
    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Enhancement in progress"
    }

@app.get("/api/result/{job_id}")
async def get_result(job_id: str):
    """Download enhanced image"""
    
    result_path = settings.PROCESSED_DIR / f"{job_id}_enhanced.jpg"
    
    if not result_path.exists():
        raise HTTPException(404, "Result not found or still processing")
    
    return FileResponse(
        path=result_path,
        media_type="image/jpeg",
        filename=f"enhanced_{job_id}.jpg"
    )

@app.delete("/api/job/{job_id}")
async def delete_job(job_id: str):
    """Delete job files"""
    
    deleted = []
    
    # Delete upload
    for upload in settings.UPLOAD_DIR.glob(f"{job_id}.*"):
        upload.unlink()
        deleted.append(str(upload.name))
    
    # Delete result
    result = settings.PROCESSED_DIR / f"{job_id}_enhanced.jpg"
    if result.exists():
        result.unlink()
        deleted.append(str(result.name))
    
    if not deleted:
        raise HTTPException(404, "Job not found")
    
    return {
        "job_id": job_id,
        "deleted_files": deleted,
        "message": "Job deleted successfully"
    }

@app.get("/api/stats")
async def get_stats():
    """Get server statistics"""
    
    upload_count = len(list(settings.UPLOAD_DIR.glob("*")))
    result_count = len(list(settings.PROCESSED_DIR.glob("*")))
    
    return {
        "uploads": upload_count,
        "results": result_count,
        "max_file_size_mb": settings.MAX_FILE_SIZE / 1024 / 1024,
        "allowed_extensions": list(settings.ALLOWED_EXTENSIONS)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
