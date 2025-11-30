// Error handling service for robust error management
export interface ErrorInfo {
    type: 'network' | 'processing' | 'memory' | 'format' | 'browser' | 'unknown';
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
    recoverable: boolean;
    suggestions: string[];
}

export class ErrorHandlingService {
    private static instance: ErrorHandlingService;
    
    private constructor() {}
    
    public static getInstance(): ErrorHandlingService {
        if (!ErrorHandlingService.instance) {
            ErrorHandlingService.instance = new ErrorHandlingService();
        }
        return ErrorHandlingService.instance;
    }
    
    // Check browser compatibility
    public checkBrowserCompatibility(): ErrorInfo | null {
        // Check for required APIs
        const requiredApis = [
            { name: 'Canvas', supported: !!document.createElement('canvas').getContext },
            { name: 'FileReader', supported: !!window.FileReader },
            { name: 'URL.createObjectURL', supported: !!window.URL && !!window.URL.createObjectURL },
            { name: 'Blob', supported: !!window.Blob },
            { name: 'Promise', supported: !!window.Promise },
            { name: 'fetch', supported: !!window.fetch }
        ];
        
        const unsupportedApis = requiredApis.filter(api => !api.supported);
        
        if (unsupportedApis.length > 0) {
            return {
                type: 'browser',
                message: `Your browser doesn't support required features: ${unsupportedApis.map(api => api.name).join(', ')}`,
                recoverable: false,
                suggestions: [
                    'Please update your browser to the latest version',
                    'Try using a modern browser like Chrome, Firefox, Safari, or Edge',
                    'Enable JavaScript if it\'s disabled'
                ]
            };
        }
        
        // Check for image format support
        const testCanvas = document.createElement('canvas');
        const testCtx = testCanvas.getContext('2d');
        
        if (!testCtx) {
            return {
                type: 'browser',
                message: 'Canvas 2D context is not supported',
                recoverable: false,
                suggestions: [
                    'Please update your browser to the latest version',
                    'Try using a different browser'
                ]
            };
        }
        
        // Test WebP support
        const webpSupported = testCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        if (!webpSupported) {
            return {
                type: 'browser',
                message: 'WebP format is not supported in your browser',
                recoverable: true,
                suggestions: [
                    'Images will be processed in JPEG or PNG format instead',
                    'For best results, consider using a browser that supports WebP'
                ]
            };
        }
        
        return null;
    }
    
    // Analyze and categorize errors
    public analyzeError(error: Error | string, context?: Record<string, any>): ErrorInfo {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const originalError = typeof error === 'string' ? undefined : error;
        
        // Network errors
        if (errorMessage.includes('fetch') || 
            errorMessage.includes('network') || 
            errorMessage.includes('connection') ||
            errorMessage.includes('timeout')) {
            return {
                type: 'network',
                message: 'Network error occurred while processing',
                originalError,
                context,
                recoverable: true,
                suggestions: [
                    'Check your internet connection',
                    'Try again in a moment',
                    'If the problem persists, try refreshing the page'
                ]
            };
        }
        
        // Memory errors
        if (errorMessage.includes('memory') || 
            errorMessage.includes('out of memory') ||
            errorMessage.includes('allocation') ||
            errorMessage.includes('Maximum call stack')) {
            return {
                type: 'memory',
                message: 'Insufficient memory to process the image',
                originalError,
                context,
                recoverable: true,
                suggestions: [
                    'Try processing a smaller image',
                    'Close other browser tabs to free up memory',
                    'Restart your browser if the problem persists'
                ]
            };
        }
        
        // Format errors
        if (errorMessage.includes('format') || 
            errorMessage.includes('unsupported') ||
            errorMessage.includes('decode') ||
            errorMessage.includes('invalid image')) {
            return {
                type: 'format',
                message: 'Unsupported or corrupted image format',
                originalError,
                context,
                recoverable: true,
                suggestions: [
                    'Try using a different image format (JPEG, PNG)',
                    'Ensure the image file is not corrupted',
                    'Try converting the image to a different format'
                ]
            };
        }
        
        // Processing errors
        if (errorMessage.includes('processing') || 
            errorMessage.includes('enhancement') ||
            errorMessage.includes('upscale') ||
            errorMessage.includes('canvas')) {
            return {
                type: 'processing',
                message: 'Error occurred during image processing',
                originalError,
                context,
                recoverable: true,
                suggestions: [
                    'Try with different enhancement settings',
                    'Reduce the upscale factor',
                    'Try processing a smaller image'
                ]
            };
        }
        
        // Unknown errors
        return {
            type: 'unknown',
            message: 'An unexpected error occurred',
            originalError,
            context,
            recoverable: true,
            suggestions: [
                'Try refreshing the page',
                'Check if your browser is up to date',
                'Contact support if the problem persists'
            ]
        };
    }
    
    // Get user-friendly error message
    public getErrorMessage(errorInfo: ErrorInfo): string {
        let message = errorInfo.message;
        
        if (errorInfo.suggestions.length > 0) {
            message += '\n\nSuggestions:\n';
            message += errorInfo.suggestions.map((suggestion, index) => 
                `${index + 1}. ${suggestion}`
            ).join('\n');
        }
        
        return message;
    }
    
    // Log error for debugging
    public logError(errorInfo: ErrorInfo): void {
        const logData = {
            timestamp: new Date().toISOString(),
            type: errorInfo.type,
            message: errorInfo.message,
            context: errorInfo.context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Image Enhancement Error:', logData);
        
        // In a production environment, you might want to send this to a logging service
        // this.sendToLoggingService(logData);
    }
    
    // Check if image is too large for processing
    public checkImageSize(file: File): Promise<ErrorInfo | null> {
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        const MAX_DIMENSION = 16384; // 16K pixels
        
        if (file.size > MAX_FILE_SIZE) {
            return Promise.resolve({
                type: 'memory',
                message: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`,
                recoverable: true,
                suggestions: [
                    'Resize the image before uploading',
                    'Compress the image to reduce file size',
                    'Try a smaller image'
                ]
            });
        }
        
        // Check image dimensions by loading it
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
                    resolve({
                        type: 'memory',
                        message: `Image dimensions are too large (${img.width}x${img.height}). Maximum dimension is ${MAX_DIMENSION}px.`,
                        recoverable: true,
                        suggestions: [
                            'Resize the image to smaller dimensions',
                            'Try cropping the image',
                            'Use a smaller image'
                        ]
                    });
                } else {
                    resolve(null);
                }
            };
            
            img.onerror = () => {
                resolve({
                    type: 'format',
                    message: 'Could not load image to check dimensions',
                    recoverable: true,
                    suggestions: [
                        'Check if the image file is corrupted',
                        'Try a different image format',
                        'Ensure the image is not password protected'
                    ]
                });
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
}

// Create singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();