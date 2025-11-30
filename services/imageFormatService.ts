// Image format handling service with quality preservation and optimization
import type { ProcessedImage } from '../types';
import { errorHandlingService } from './errorHandlingService';

export interface FormatInfo {
    format: 'jpeg' | 'png' | 'webp' | 'tiff' | 'avif' | 'unknown';
    mimeType: string;
    supportsTransparency: boolean;
    supportsAnimation: boolean;
    qualityRange: [number, number];
    defaultQuality: number;
    compressionType: 'lossy' | 'lossless' | 'both';
    browserSupport: 'full' | 'partial' | 'none';
    recommendedFor: string[];
}

export interface ConversionOptions {
    targetFormat?: 'jpeg' | 'png' | 'webp' | 'avif';
    quality?: number;
    preserveTransparency?: boolean;
    optimizeSize?: boolean;
    progressive?: boolean;
    stripMetadata?: boolean;
}

export interface FormatConversionResult {
    dataUrl: string;
    originalFormat: string;
    targetFormat: string;
    originalSize: number;
    convertedSize: number;
    compressionRatio: number;
    processingTime: number;
}

export class ImageFormatService {
    private static instance: ImageFormatService;
    private supportedFormats: Map<string, FormatInfo> = new Map();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;

    private constructor() {
        this.initializeSupportedFormats();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });
    }

    public static getInstance(): ImageFormatService {
        if (!ImageFormatService.instance) {
            ImageFormatService.instance = new ImageFormatService();
        }
        return ImageFormatService.instance;
    }

    // Initialize supported formats with their properties
    private initializeSupportedFormats(): void {
        const formats: FormatInfo[] = [
            {
                format: 'jpeg',
                mimeType: 'image/jpeg',
                supportsTransparency: false,
                supportsAnimation: false,
                qualityRange: [0.1, 1.0],
                defaultQuality: 0.85,
                compressionType: 'lossy',
                browserSupport: 'full',
                recommendedFor: ['photographs', 'complex images', 'web images']
            },
            {
                format: 'png',
                mimeType: 'image/png',
                supportsTransparency: true,
                supportsAnimation: false,
                qualityRange: [0, 1],
                defaultQuality: 1.0,
                compressionType: 'lossless',
                browserSupport: 'full',
                recommendedFor: ['graphics', 'logos', 'images with transparency', 'screenshots']
            },
            {
                format: 'webp',
                mimeType: 'image/webp',
                supportsTransparency: true,
                supportsAnimation: true,
                qualityRange: [0.1, 1.0],
                defaultQuality: 0.85,
                compressionType: 'both',
                browserSupport: 'full',
                recommendedFor: ['web images', 'photographs', 'graphics', 'optimized delivery']
            },
            {
                format: 'tiff',
                mimeType: 'image/tiff',
                supportsTransparency: true,
                supportsAnimation: false,
                qualityRange: [0.8, 1.0],
                defaultQuality: 1.0,
                compressionType: 'lossless',
                browserSupport: 'none',
                recommendedFor: ['professional photography', 'printing', 'archival']
            },
            {
                format: 'avif',
                mimeType: 'image/avif',
                supportsTransparency: true,
                supportsAnimation: true,
                qualityRange: [0.1, 1.0],
                defaultQuality: 0.8,
                compressionType: 'both',
                browserSupport: 'partial',
                recommendedFor: ['next-gen web images', 'high compression', 'modern browsers']
            }
        ];

        formats.forEach(format => {
            this.supportedFormats.set(format.format, format);
        });
    }

    // Detect image format from file or data URL
    public detectFormat(imageDataUrl: string, file?: File): FormatInfo {
        // Try to get format from file extension first
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension) {
                const format = this.supportedFormats.get(extension);
                if (format) return format;
            }
        }

        // Try to detect from data URL
        if (imageDataUrl.startsWith('data:')) {
            const mimeMatch = imageDataUrl.match(/data:([^;]+)/);
            if (mimeMatch) {
                const mimeType = mimeMatch[1];
                for (const format of this.supportedFormats.values()) {
                    if (format.mimeType === mimeType) {
                        return format;
                    }
                }
            }
        }

        // Default to unknown
        return {
            format: 'unknown',
            mimeType: 'application/octet-stream',
            supportsTransparency: false,
            supportsAnimation: false,
            qualityRange: [0, 1],
            defaultQuality: 0.8,
            compressionType: 'lossy',
            browserSupport: 'none',
            recommendedFor: []
        };
    }

    // Check if a format is supported in the current browser
    public isFormatSupported(format: string): boolean {
        const formatInfo = this.supportedFormats.get(format);
        if (!formatInfo) return false;

        if (formatInfo.browserSupport === 'full') return true;
        if (formatInfo.browserSupport === 'none') return false;

        // For partial support, check actual browser capability
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1;
        testCanvas.height = 1;
        const testCtx = testCanvas.getContext('2d');
        if (!testCtx) return false;

        try {
            const dataUrl = testCanvas.toDataURL(formatInfo.mimeType);
            return dataUrl.indexOf(`data:${formatInfo.mimeType}`) === 0;
        } catch {
            return false;
        }
    }

    // Get the best format for a specific use case
    public getBestFormatForUseCase(useCase: 'web' | 'print' | 'archive' | 'mobile'): FormatInfo {
        switch (useCase) {
            case 'web':
                // Prefer WebP if supported, otherwise JPEG
                if (this.isFormatSupported('webp')) {
                    return this.supportedFormats.get('webp')!;
                } else if (this.isFormatSupported('avif')) {
                    return this.supportedFormats.get('avif')!;
                } else {
                    return this.supportedFormats.get('jpeg')!;
                }
            case 'print':
                // Use PNG for high quality
                return this.supportedFormats.get('png')!;
            case 'archive':
                // Use lossless format
                return this.supportedFormats.get('png')!;
            case 'mobile':
                // Use efficient format
                if (this.isFormatSupported('webp')) {
                    return this.supportedFormats.get('webp')!;
                } else {
                    return this.supportedFormats.get('jpeg')!;
                }
            default:
                return this.supportedFormats.get('jpeg')!;
        }
    }

    // Convert image to different format with quality preservation
    public async convertFormat(
        imageDataUrl: string,
        options: ConversionOptions = {}
    ): Promise<FormatConversionResult> {
        const startTime = Date.now();
        
        try {
            // Load the image
            const img = await this.loadImage(imageDataUrl);
            
            // Detect original format
            const originalFormat = this.detectFormat(imageDataUrl);
            
            // Determine target format
            const targetFormatName = options.targetFormat || this.getBestFormatForUseCase('web').format;
            const formatInfo = this.supportedFormats.get(targetFormatName);
            
            if (!formatInfo) {
                throw new Error(`Unsupported target format: ${targetFormatName}`);
            }
            
            if (!this.isFormatSupported(targetFormatName)) {
                throw new Error(`Format ${targetFormatName} is not supported in this browser`);
            }
            
            // Set up canvas
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            
            if (!this.ctx) {
                throw new Error('Could not get canvas context');
            }
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Handle transparency preservation
            if (!formatInfo.supportsTransparency && originalFormat.supportsTransparency) {
                // Add white background for formats that don't support transparency
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // Draw image
            this.ctx.drawImage(img, 0, 0);
            
            // Determine quality
            let quality = options.quality ?? formatInfo.defaultQuality;
            
            // Clamp quality to valid range
            quality = Math.max(formatInfo.qualityRange[0], Math.min(formatInfo.qualityRange[1], quality));
            
            // Convert to target format
            const convertedDataUrl = this.canvas.toDataURL(formatInfo.mimeType, quality);
            
            // Calculate sizes
            const originalSize = this.getDataUrlSize(imageDataUrl);
            const convertedSize = this.getDataUrlSize(convertedDataUrl);
            const compressionRatio = originalSize > 0 ? convertedSize / originalSize : 1;
            
            return {
                dataUrl: convertedDataUrl,
                originalFormat: originalFormat.format,
                targetFormat: targetFormatName,
                originalSize,
                convertedSize,
                compressionRatio,
                processingTime: Date.now() - startTime
            };
        } catch (error) {
            const errorInfo = errorHandlingService.analyzeError(
                error instanceof Error ? error : new Error(String(error)),
                { operation: 'formatConversion', options }
            );
            errorHandlingService.logError(errorInfo);
            throw error;
        }
    }

    // Optimize image for web delivery
    public async optimizeForWeb(
        imageDataUrl: string,
        options: {
            maxWidth?: number;
            maxHeight?: number;
            quality?: number;
            format?: 'jpeg' | 'webp' | 'avif';
        } = {}
    ): Promise<FormatConversionResult> {
        const { maxWidth = 2048, maxHeight = 2048, quality = 0.85, format } = options;
        
        try {
            // Load the image
            const img = await this.loadImage(imageDataUrl);
            
            // Calculate new dimensions if needed
            let { width, height } = img;
            const aspectRatio = width / height;
            
            if (width > maxWidth) {
                width = maxWidth;
                height = Math.round(width / aspectRatio);
            }
            
            if (height > maxHeight) {
                height = maxHeight;
                width = Math.round(height * aspectRatio);
            }
            
            // Set up canvas
            this.canvas.width = width;
            this.canvas.height = height;
            
            if (!this.ctx) {
                throw new Error('Could not get canvas context');
            }
            
            // Draw resized image
            this.ctx.drawImage(img, 0, 0, width, height);
            
            // Determine format
            const targetFormat = format || this.getBestFormatForUseCase('web').format;
            const formatInfo = this.supportedFormats.get(targetFormat);
            
            if (!formatInfo) {
                throw new Error(`Unsupported format: ${targetFormat}`);
            }
            
            // Convert
            const optimizedDataUrl = this.canvas.toDataURL(formatInfo.mimeType, quality);
            
            // Calculate sizes
            const originalSize = this.getDataUrlSize(imageDataUrl);
            const optimizedSize = this.getDataUrlSize(optimizedDataUrl);
            const compressionRatio = originalSize > 0 ? optimizedSize / originalSize : 1;
            
            return {
                dataUrl: optimizedDataUrl,
                originalFormat: this.detectFormat(imageDataUrl).format,
                targetFormat: targetFormat,
                originalSize,
                convertedSize: optimizedSize,
                compressionRatio,
                processingTime: 0 // Not tracking for this method
            };
        } catch (error) {
            const errorInfo = errorHandlingService.analyzeError(
                error instanceof Error ? error : new Error(String(error)),
                { operation: 'webOptimization', options }
            );
            errorHandlingService.logError(errorInfo);
            throw error;
        }
    }

    // Get format information
    public getFormatInfo(format: string): FormatInfo | undefined {
        return this.supportedFormats.get(format);
    }

    // Get all supported formats
    public getAllSupportedFormats(): FormatInfo[] {
        return Array.from(this.supportedFormats.values()).filter(format => 
            this.isFormatSupported(format.format)
        );
    }

    // Helper method to load image
    private loadImage(imageDataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageDataUrl;
        });
    }

    // Helper method to get data URL size
    private getDataUrlSize(dataUrl: string): number {
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;
        
        // Calculate size of base64 string (4 chars = 3 bytes)
        return Math.floor(base64.length * 0.75);
    }

    // Process image format for processed image
    public async processImageFormat(
        processedImage: ProcessedImage,
        options: ConversionOptions = {}
    ): Promise<ProcessedImage> {
        if (!processedImage.upscaledDataUrl) {
            throw new Error('No upscaled image data available');
        }

        try {
            // Convert format if needed
            const conversionResult = await this.convertFormat(
                processedImage.upscaledDataUrl,
                options
            );

            // Update processed image
            processedImage.upscaledDataUrl = conversionResult.dataUrl;
            processedImage.format = conversionResult.targetFormat as ProcessedImage['format'];
            
            // Update size information
            if (processedImage.upscaledSize) {
                processedImage.upscaledSize = conversionResult.convertedSize;
            }

            // Add to processing log
            if (!processedImage.processingLog) {
                processedImage.processingLog = [];
            }
            processedImage.processingLog.push(
                `Format converted from ${conversionResult.originalFormat} to ${conversionResult.targetFormat} ` +
                `(Compression: ${(1 - conversionResult.compressionRatio).toFixed(1)}%)`
            );

            return processedImage;
        } catch (error) {
            processedImage.status = 'error';
            processedImage.error = typeof error === 'string' ? error : error.message;
            throw error;
        }
    }
}

// Create singleton instance
export const imageFormatService = ImageFormatService.getInstance();