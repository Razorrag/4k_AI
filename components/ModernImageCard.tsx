import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, ExclamationTriangleIcon, XMarkIcon, RetryIcon, SparklesIcon, EyeIcon } from './Icons';
import { ActionButton } from './ui/ActionButton';
import { useAppContext } from '../context/AppContext';
import { useImageProcessor } from '../hooks/useImageProcessor';
import type { ProcessedImage } from '../types';

interface ModernImageCardProps {
    image: ProcessedImage;
    lazyLoad?: boolean;
    onImageLoad?: (imageId: string) => void;
    onImageSelect?: (imageId: string) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg 
            width="90" height="90" viewBox="0 0 90 90" className="-rotate-90"
            aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} role="progressbar"
            aria-label={`Upscaling progress: ${Math.round(progress)}%`}
        >
            <circle
                cx="45" cy="45" r={radius}
                className="stroke-current text-white/10"
                strokeWidth="4" fill="transparent"
            />
            <motion.circle
                cx="45" cy="45" r={radius}
                className="stroke-current text-[var(--color-primary-light)]"
                strokeWidth="4" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </svg>
    );
};

const StatusBadge: React.FC<{ status: ProcessedImage['status'] }> = ({ status }) => {
    const statusConfig = {
        pending: {
            label: 'Queued',
            color: 'bg-gradient-to-r from-gray-600/90 to-gray-500/90',
            textColor: 'text-white',
            borderColor: 'border-gray-400/30'
        },
        upscaling: {
            label: 'Processing',
            color: 'bg-gradient-to-r from-blue-600/90 to-blue-500/90',
            textColor: 'text-white',
            borderColor: 'border-blue-400/30'
        },
        completed: {
            label: 'Enhanced',
            color: 'bg-gradient-to-r from-green-600/90 to-green-500/90',
            textColor: 'text-white',
            borderColor: 'border-green-400/30'
        },
        error: {
            label: 'Error',
            color: 'bg-gradient-to-r from-red-600/90 to-red-500/90',
            textColor: 'text-white',
            borderColor: 'border-red-400/30'
        },
        'size-error': {
            label: 'File Too Large',
            color: 'bg-gradient-to-r from-orange-600/90 to-orange-500/90',
            textColor: 'text-white',
            borderColor: 'border-orange-400/30'
        },
    };

    const config = statusConfig[status];

    return (
        <div className={`absolute top-3 left-3 z-10 px-3 py-1.5 text-xs font-bold ${config.textColor} rounded-full backdrop-blur-md ${config.color} ${config.borderColor} border shadow-lg`}>
            {config.label}
        </div>
    )
}

export const ModernImageCard: React.FC<ModernImageCardProps> = ({
    image,
    lazyLoad = false,
    onImageLoad,
    onImageSelect
}) => {
    const { settings, isProcessing, updateImage } = useAppContext();
    const { retryImage, removeImage } = useImageProcessor();
    const [showSuccess, setShowSuccess] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isInView, setIsInView] = useState(!lazyLoad);
    const imageRef = useRef<HTMLDivElement>(null);

    // Set up intersection observer for lazy loading
    useEffect(() => {
        if (!lazyLoad || isInView) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => observer.disconnect();
    }, [lazyLoad, isInView]);

    // Handle image load
    const handleImageLoadInternal = useCallback(() => {
        setImageLoaded(true);
        onImageLoad?.(image.id);
    }, [image.id, onImageLoad]);

    const handleDownload = () => {
        if (!image.upscaledDataUrl) return;
        const link = document.createElement('a');
        link.href = image.upscaledDataUrl;
        const nameParts = image.file.name.split('.');
        const originalExtension = nameParts.pop();
        const name = nameParts.join('.');
        
        // Determine output extension based on image format
        let outputExtension = originalExtension;
        if (image.format === 'png') {
            outputExtension = 'png';
        } else if (image.format === 'tiff') {
            // TIFF is not supported for output, use PNG instead
            outputExtension = 'png';
        } else if (image.format === 'jpeg') {
            outputExtension = 'jpg';
        } else if (image.format === 'webp') {
            outputExtension = 'webp';
        } else {
            outputExtension = 'png'; // Default fallback
        }
        
        link.download = `${name}-upscaled-${settings.factor}.${outputExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success indicator
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleImageClick = () => {
        if (image.status === 'completed') {
            onImageSelect?.(image.id);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1.0 }
    };
    
    const getProgressText = (progress?: number, status?: ProcessedImage['status']) => {
        if (status === 'upscaling') {
            if (!progress || progress < 11) return 'Initializing...';
            if (progress < 31) return 'Processing...';
            if (progress < 81) return 'Enhancing details...';
            return 'Finalizing...';
        }
        return 'Ready';
    }

    return (
        <motion.div
            variants={cardVariants}
            layout
            whileHover={{
                scale: 1.03,
                y: -5,
                transition: { type: 'spring', stiffness: 300, damping: 30 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group relative h-full min-h-[420px] interactive-card ${
                image.status === 'completed'
                    ? 'ring-2 ring-[var(--color-primary)]/40 shadow-xl shadow-[var(--color-primary)]/25 cursor-pointer hover:shadow-2xl hover:shadow-[var(--color-primary)]/35'
                    : 'shadow-lg hover:shadow-xl'
            }`}
            aria-label={`Image: ${image.file.name}, Status: ${image.status}`}
            onClick={handleImageClick}
        >
            {/* Success Animation Overlay */}
            {image.status === 'completed' && (
                <div className="absolute inset-0 rounded-xl pointer-events-none z-10"
                     style={{ animation: 'pulse-once-gold 1.5s ease-out forwards' }}>
                </div>
            )}
             
            {/* Image Container */}
            <div ref={imageRef} className="relative w-full h-72 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
                <StatusBadge status={image.status} />
                
                {/* Loading placeholder for lazy loaded images */}
                {lazyLoad && !isInView && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)]">
                        <div className="w-10 h-10 border-2 border-[var(--color-glass-border)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                    </div>
                )}
                 
                 {/* Quality Metrics */}
                 {image.status === 'completed' && image.qualityMetrics && (
                     <motion.div
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         whileHover={{ scale: 1.1 }}
                         transition={{ delay: 0.3 }}
                         className="absolute top-3 right-3 z-20 glass-panel rounded-xl p-3 text-xs text-white border border-[var(--color-primary)]/30 backdrop-blur-sm glow-pulse"
                     >
                         <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></div>
                             <span className="font-semibold text-[var(--color-text)]">Enhanced</span>
                         </div>
                     </motion.div>
                 )}
                
                <AnimatePresence>
                {image.status === 'completed' && image.upscaledDataUrl ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                    >
                        <motion.img
                            src={image.upscaledDataUrl}
                            alt="Enhanced"
                            className="w-full h-full object-cover"
                            loading={lazyLoad ? "lazy" : "eager"}
                            onLoad={handleImageLoadInternal}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                        />
                        {image.status === 'completed' && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ opacity: 1, scale: 1.1, rotate: 5 }}
                                        className="bg-white/20 backdrop-blur-sm rounded-full p-4 magnetic-button"
                                    >
                                        <EyeIcon className="h-10 w-10 text-white" />
                                    </motion.div>
                                </div>
                                <motion.div
                                    className="absolute bottom-4 left-4 right-4"
                                    initial={{ y: 10, opacity: 0 }}
                                    whileHover={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <p className="text-white text-base font-medium drop-shadow-lg text-center">Click to view full comparison</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                        <motion.img
                            src={image.originalDataUrl}
                            alt="Original"
                            className="w-full h-full object-cover opacity-60"
                            loading={lazyLoad ? "lazy" : "eager"}
                            onLoad={handleImageLoadInternal}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={image.status}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center justify-center"
                                >
                                {image.status === 'upscaling' && (
                                    <motion.div
                                        className="relative flex flex-col items-center justify-center"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    >
                                       <CircularProgress progress={image.progress || 0} />
                                       <div className="absolute flex flex-col items-center justify-center">
                                         <span className="text-xl font-bold text-white tabular-nums">{Math.round(image.progress || 0)}%</span>
                                         <span className="text-xs text-white/70 mt-1">{getProgressText(image.progress, image.status)}</span>
                                       </div>
                                    </motion.div>
                                )}
                                {image.status === 'pending' &&
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <SparklesIcon className="h-8 w-8 text-gray-400 mb-2" />
                                        <div className="text-[var(--color-text)] text-sm font-semibold">Queued</div>
                                    </motion.div>
                                }
                                {(image.status === 'error' || image.status === 'size-error') && (
                                    <motion.div
                                        animate={{ x: [0, -5, 5, -5, 0] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                    >
                                        <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mb-2" />
                                        <p className="text-sm text-[var(--color-text)] font-bold">Failed</p>
                                    </motion.div>
                                )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                   </div>
                )}
                </AnimatePresence>
               {showSuccess && (
                   <motion.div
                       initial={{ scale: 0.8, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.8, opacity: 0 }}
                       className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl"
                   >
                       <div className="text-white text-center">
                           <div className="text-2xl mb-1">✓</div>
                           <div className="text-sm">Downloaded!</div>
                       </div>
                   </motion.div>
               )}
            </div>
           
            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-[var(--color-text)] truncate mb-3" title={image.file.name}>
                        {image.file.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span className="font-medium">{image.originalDimensions.width} × {image.originalDimensions.height}</span>
                        </span>
                        <span className="text-[var(--color-text-muted)]">•</span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{formatBytes(image.originalSize)}</span>
                        </span>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {image.status === 'completed' ? (
                            <>
                                <ActionButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onImageSelect?.(image.id);
                                    }}
                                    variant="primary"
                                    className="h-10 px-4 text-sm font-medium rounded-lg"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    <span>Compare</span>
                                </ActionButton>
                                <ActionButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload();
                                    }}
                                    variant="secondary"
                                    className="h-10 px-4 text-sm font-medium rounded-lg"
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                    <span>Download</span>
                                </ActionButton>
                            </>
                        ) : image.status === 'error' || image.status === 'size-error' ? (
                            <ActionButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    retryImage(image.id);
                                }}
                                disabled={isProcessing}
                                variant="primary"
                                className="h-10 px-4 text-sm font-medium rounded-lg"
                            >
                                <RetryIcon className="h-4 w-4" />
                                <span>Retry</span>
                            </ActionButton>
                        ) : (
                            <div className="h-10 flex items-center justify-center">
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                                    <span>Ready for enhancement</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Remove Button */}
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                        }}
                        className="h-10 w-10 bg-[var(--color-glass-bg)] backdrop-blur-sm rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100 border border-[var(--color-glass-border)]"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};