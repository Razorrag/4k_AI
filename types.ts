// Type definitions for the 4K AI Image Enhancer application

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  enhancedUrl?: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  enhancedWidth?: number;
  enhancedHeight?: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processingTime?: number;
  model?: string;
  quality?: number;
  metadata?: {
    originalFormat: string;
    enhancedFormat?: string;
    colorSpace?: string;
    hasAlpha?: boolean;
  };
}

export interface UpscaleSettings {
  factor: '2x' | '4x' | '8x';
  mode: 'photorealistic' | 'artistic' | 'anime' | 'technical';
  negativePrompt?: string;
}

export interface EnhancedUpscaleSettings extends UpscaleSettings {
  detailLevel: 'standard' | 'enhanced' | 'ultra';
  colorProfile: 'natural' | 'vibrant' | 'dramatic' | 'monochrome';
  textureSynthesis: boolean;
  noiseReduction: number;
  contrastAdjustment: number;
  brightnessAdjustment: number;
  gammaCorrection: number;
  sharpening: number;
  colorCorrection: boolean;
  gammaAdjustment: number;
  artifactReduction: number;
  contentAwareProcessing: boolean;
  modelSelection: 'auto' | 'photorealistic' | 'artistic' | 'anime' | 'technical';
  qualityVsSpeed: 'fast' | 'balanced' | 'quality';
}

export interface ContentDetection {
  hasFaces: boolean;
  hasText: boolean;
  hasNature: boolean;
  hasArchitecture: boolean;
  hasArt: boolean;
  dominantColors: string[];
  estimatedQuality: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface EnhancementModel {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
  maxResolution: number;
  processingTime: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'ultra';
  bestFor: string[];
}

export interface ModelRouter {
  selectModel: (image: ProcessedImage, settings: EnhancedUpscaleSettings) => EnhancementModel;
  getOptimalSettings: (image: ProcessedImage) => Partial<EnhancedUpscaleSettings>;
}

export interface ProcessingPipeline {
  stages: ProcessingStage[];
  execute: (image: ProcessedImage, settings: EnhancedUpscaleSettings) => Promise<ProcessedImage>;
}

export interface ProcessingStage {
  id: string;
  name: string;
  execute: (image: ProcessedImage, settings: EnhancedUpscaleSettings) => Promise<ProcessedImage>;
  skip?: (image: ProcessedImage, settings: EnhancedUpscaleSettings) => boolean;
}