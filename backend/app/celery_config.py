"""Celery Configuration"""

from celery import Celery
from .config import settings

celery_app = Celery(
    "ai_enhancer",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.enhancement"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=10,
    
    # Task settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=settings.JOB_TIMEOUT,
    task_soft_time_limit=settings.JOB_TIMEOUT - 30,
    
    # Result backend settings
    result_expires=3600,
    result_persistent=False,
)
