// Barrel export for types
export type { 
  ProcessedImage, 
  UpscaleSettings, 
  EnhancedUpscaleSettings
} from '../types';

// API Types for backend communication
export interface UploadResponse {
  job_id: string;
  task_id: string;
  status: string;
  message: string;
  original_filename: string;
  file_size: number;
}

export interface StatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  completed_at?: string;
  message?: string;
  error?: string;
  progress?: number;
  stage?: string;
}

export interface StatsResponse {
  uploads: number;
  results: number;
  max_file_size_mb: number;
  allowed_extensions: string[];
}

export interface QualityMetrics {
  psnr: number;
  ssim: number;
  sharpness_gain: number;
}