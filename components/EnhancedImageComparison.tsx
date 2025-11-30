import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, XMarkIcon, ArrowLeftIcon, ArrowRightIcon, EyeIcon, ZoomInIcon, ZoomOutIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from './Icons';
import { ActionButton } from './ui/ActionButton';
import { EnhancedSlider } from './EnhancedSlider';
import { useAppContext } from '../context/AppContext';
import { useImageProcessor } from '../hooks/useImageProcessor';
import type { ProcessedImage } from '../types';

interface ZoomState {
    scale: number;
    positionX: number;
    positionY: number;
}

export const EnhancedImageComparison: React.FC = () => {
    const { images, selectedImageId, setSelectedImageId, setViewMode, updateImage } = useAppContext();
    const { removeImage } = useImageProcessor();
    const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
    const [showSuccess, setShowSuccess] = useState(false);
    const [zoomState, setZoomState] = useState<ZoomState>({ scale: 1, positionX: 0, positionY: 0 });
    const [isZoomed, setIsZoomed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Find the selected image
    const selectedImage = images.find(img => img.id === selectedImageId);
    
    // Get current and next/previous image indices
    const currentIndex = selectedImage ? images.findIndex(img => img.id === selectedImageId) : -1;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1 && currentIndex >= 0;

    const handlePrevious = () => {
        if (hasPrevious) {
            const prevImage = images[currentIndex - 1];
            setSelectedImageId(prevImage.id);
            // Reset comparison mode when changing images
            setComparisonMode('slider');
            resetZoom();
        }
    };

    const handleNext = () => {
        if (hasNext) {
            const nextImage = images[currentIndex + 1];
            setSelectedImageId(nextImage.id);
            // Reset comparison mode when changing images
            setComparisonMode('slider');
            resetZoom();
        }
    };

    const handleClose = () => {
        setViewMode('gallery');
        setSelectedImageId(null);
        resetZoom();
    };

    const handleDownload = () => {
        if (!selectedImage?.upscaledDataUrl) return;
        
        const link = document.createElement('a');
        link.href = selectedImage.upscaledDataUrl;
        const nameParts = selectedImage.file.name.split('.');
        const originalExtension = nameParts.pop();
        const name = nameParts.join('.');
        
        // Determine output extension based on image format
        let outputExtension = originalExtension;
        if (selectedImage.format === 'png') {
            outputExtension = 'png';
        } else if (selectedImage.format === 'tiff') {
            outputExtension = 'png';
        } else if (selectedImage.format === 'jpeg') {
            outputExtension = 'jpg';
        } else if (selectedImage.format === 'webp') {
            outputExtension = 'webp';
        } else {
            outputExtension = 'png';
        }
        
        link.download = `${name}-upscaled-4x.${outputExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success indicator
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleSliderPositionChange = (position: number) => {
        if (selectedImage) {
            updateImage(selectedImage.id, { dividerPosition: position });
        }
    };

    const resetZoom = useCallback(() => {
        setZoomState({ scale: 1, positionX: 0, positionY: 0 });
        setIsZoomed(false);
    }, []);

    const handleZoomIn = useCallback(() => {
        const newScale = Math.min(zoomState.scale * 1.2, 5);
        setZoomState(prev => ({ ...prev, scale: newScale }));
        setIsZoomed(true);
    }, [zoomState.scale]);

    const handleZoomOut = useCallback(() => {
        const newScale = Math.max(zoomState.scale / 1.2, 1);
        setZoomState(prev => ({ ...prev, scale: newScale }));
        if (newScale === 1) {
            setIsZoomed(false);
            setZoomState({ scale: 1, positionX: 0, positionY: 0 });
        }
    }, [zoomState.scale]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    }, [handleZoomIn, handleZoomOut]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (isZoomed) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - zoomState.positionX, y: e.clientY - zoomState.positionY });
        }
    }, [isZoomed, zoomState.positionX, zoomState.positionY]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && isZoomed) {
            const newPositionX = e.clientX - dragStart.x;
            const newPositionY = e.clientY - dragStart.y;
            setZoomState(prev => ({ ...prev, positionX: newPositionX, positionY: newPositionY }));
        }
    }, [isDragging, isZoomed, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    if (!selectedImage || selectedImage.status !== 'completed') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 glass-panel-pro border-b border-[var(--color-panel-border)] rounded-t-2xl">
                <div className="flex items-center gap-4">
                    <ActionButton
                        onClick={handleClose}
                        variant="secondary"
                        className="p-2"
                        title="Back to gallery"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </ActionButton>
                    
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">{selectedImage.file.name}</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            {selectedImage.originalDimensions.width} × {selectedImage.originalDimensions.height} → 
                            {selectedImage.originalDimensions.width * 4} × {selectedImage.originalDimensions.height * 4}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-1">
                        <button
                            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            onClick={handleZoomOut}
                            disabled={zoomState.scale <= 1}
                            title="Zoom out"
                        >
                            <ZoomOutIcon className="h-4 w-4" />
                        </button>
                        <span className="px-2 text-xs text-white/70 min-w-[3rem] text-center">
                            {Math.round(zoomState.scale * 100)}%
                        </span>
                        <button
                            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            onClick={handleZoomIn}
                            disabled={zoomState.scale >= 5}
                            title="Zoom in"
                        >
                            <ZoomInIcon className="h-4 w-4" />
                        </button>
                        <button
                            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            onClick={resetZoom}
                            title="Reset zoom"
                        >
                            <ArrowsPointingInIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Comparison Mode Toggle */}
                    <div className="hidden sm:flex bg-white/10 rounded-lg p-1">
                        <button
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                                comparisonMode === 'slider'
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            onClick={() => setComparisonMode('slider')}
                            title="Slider View: Drag to compare before and after"
                        >
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span>Slider</span>
                            </div>
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                                comparisonMode === 'side-by-side'
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            onClick={() => setComparisonMode('side-by-side')}
                            title="Side-by-Side View: Compare images side by side"
                        >
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                <span>Side-by-Side</span>
                            </div>
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                                comparisonMode === 'toggle'
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            onClick={() => setComparisonMode('toggle')}
                            title="Toggle View: Hover to switch between before and after"
                        >
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5h12M8 12h12M8 19h12" />
                                </svg>
                                <span>Toggle</span>
                            </div>
                        </button>
                    </div>

                    <ActionButton
                        onClick={handleDownload}
                        variant="primary"
                        className="px-4 py-2"
                    >
                        <DownloadIcon className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Download</span>
                    </ActionButton>
                </div>
            </div>

            {/* Main Content */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-auto cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isZoomed && isDragging ? 'grabbing' : isZoomed ? 'grab' : 'default' }}
            >
                <AnimatePresence mode="wait">
                    {comparisonMode === 'slider' && (
                        <motion.div
                            key="slider"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                            style={{
                                transform: `scale(${zoomState.scale}) translate(${zoomState.positionX / zoomState.scale}px, ${zoomState.positionY / zoomState.scale}px)`,
                                transformOrigin: 'center',
                                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                            }}
                        >
                            <EnhancedSlider
                                originalImage={selectedImage.originalDataUrl}
                                enhancedImage={selectedImage.upscaledDataUrl!}
                                initialPosition={selectedImage.dividerPosition || 50}
                                onPositionChange={handleSliderPositionChange}
                                className="w-full h-full"
                            />
                        </motion.div>
                    )}
                    
                    {comparisonMode === 'side-by-side' && (
                        <motion.div
                            key="side-by-side"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex"
                            style={{
                                transform: `scale(${zoomState.scale}) translate(${zoomState.positionX / zoomState.scale}px, ${zoomState.positionY / zoomState.scale}px)`,
                                transformOrigin: 'center',
                                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                            }}
                        >
                            <div className="w-1/2 relative">
                                <img
                                    src={selectedImage.originalDataUrl}
                                    alt="Original"
                                    className="w-full h-full object-contain"
                                    draggable={false}
                                />
                                <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    Original
                                </div>
                            </div>
                            <div className="w-1/2 relative">
                                <img
                                    src={selectedImage.upscaledDataUrl!}
                                    alt="Enhanced"
                                    className="w-full h-full object-contain"
                                    draggable={false}
                                />
                                <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    Enhanced
                                </div>
                            </div>
                        </motion.div>
                    )}
                    
                    {comparisonMode === 'toggle' && (
                        <motion.div
                            key="toggle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full relative"
                            style={{
                                transform: `scale(${zoomState.scale}) translate(${zoomState.positionX / zoomState.scale}px, ${zoomState.positionY / zoomState.scale}px)`,
                                transformOrigin: 'center',
                                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                            }}
                        >
                            <img
                                src={selectedImage.originalDataUrl}
                                alt="Original"
                                className="w-full h-full object-contain"
                                draggable={false}
                            />
                            <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                                Original
                            </div>
                            <div
                                className="absolute inset-0 bg-black/80 flex items-center justify-center cursor-pointer"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0';
                                    const enhancedImg = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (enhancedImg) enhancedImg.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.8';
                                    const enhancedImg = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (enhancedImg) enhancedImg.style.opacity = '0';
                                }}
                            >
                                <div className="text-white text-center">
                                    <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                                    <div className="text-sm font-medium">Hover to see enhanced</div>
                                </div>
                            </div>
                            <img
                                src={selectedImage.upscaledDataUrl!}
                                alt="Enhanced"
                                className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-300"
                                style={{ pointerEvents: 'none' }}
                                draggable={false}
                            />
                            <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm opacity-0" style={{ pointerEvents: 'none' }}>
                                Enhanced
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        {hasPrevious && (
                            <ActionButton
                                onClick={handlePrevious}
                                variant="secondary"
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white z-10"
                                title="Previous image"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </ActionButton>
                        )}
                        
                        {hasNext && (
                            <ActionButton
                                onClick={handleNext}
                                variant="secondary"
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white z-10"
                                title="Next image"
                            >
                                <ArrowRightIcon className="h-5 w-5" />
                            </ActionButton>
                        )}
                    </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm z-10">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                {/* Zoom Indicator */}
                {isZoomed && (
                    <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm z-10">
                        {Math.round(zoomState.scale * 100)}% • Scroll to zoom • Drag to pan
                    </div>
                )}
            </div>

            {/* Success Animation Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/70 z-50"
                    >
                        <div className="text-white text-center">
                            <div className="text-4xl mb-2">✓</div>
                            <div className="text-lg">Downloaded!</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
