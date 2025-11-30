import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DownloadIcon, 
    XMarkIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    EyeIcon,
    ZoomInIcon,
    ZoomOutIcon,
    ResetIcon,
    ExpandIcon,
    CompressIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon
} from './Icons';
import { ActionButton } from './ui/ActionButton';
import { useAppContext } from '../context/AppContext';
import { useImageProcessor } from '../hooks/useImageProcessor';
import type { ProcessedImage } from '../types';

interface ZoomState {
    scale: number;
    positionX: number;
    positionY: number;
}

interface FullScreenComparisonProps {
    imageId: string;
    onClose: () => void;
}

export const FullScreenComparison: React.FC<FullScreenComparisonProps> = ({ imageId, onClose }) => {
    const { images, setSelectedImageId, updateImage } = useAppContext();
    const { removeImage } = useImageProcessor();
    const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'toggle'>('side-by-side');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomState, setZoomState] = useState<ZoomState>({ scale: 1, positionX: 0, positionY: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    // Find the selected image
    const selectedImage = images.find(img => img.id === imageId);
    
    // Get current and next/previous image indices
    const currentIndex = selectedImage ? images.findIndex(img => img.id === imageId) : -1;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1 && currentIndex >= 0;

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    if (isFullscreen) {
                        toggleFullscreen();
                    } else {
                        handleClose();
                    }
                    break;
                case 'ArrowLeft':
                    if (hasPrevious) handlePrevious();
                    break;
                case 'ArrowRight':
                    if (hasNext) handleNext();
                    break;
                case ' ':
                    e.preventDefault();
                    setComparisonMode(prev => 
                        prev === 'slider' ? 'side-by-side' : 
                        prev === 'side-by-side' ? 'toggle' : 'slider'
                    );
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    handleZoomOut();
                    break;
                case '0':
                    handleZoomReset();
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasPrevious, hasNext, isFullscreen]);

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handlePrevious = () => {
        if (hasPrevious) {
            const prevImage = images[currentIndex - 1];
            setSelectedImageId(prevImage.id);
            setComparisonMode('side-by-side');
            handleZoomReset();
        }
    };

    const handleNext = () => {
        if (hasNext) {
            const nextImage = images[currentIndex + 1];
            setSelectedImageId(nextImage.id);
            setComparisonMode('side-by-side');
            handleZoomReset();
        }
    };

    const handleClose = () => {
        onClose();
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
        
        link.download = `${name}-upscaled-${selectedImage.settings?.factor || '4x'}.${outputExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success indicator
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleSliderPositionChange = (position: number) => {
        setSliderPosition(position);
        if (selectedImage) {
            updateImage(selectedImage.id, { dividerPosition: position });
        }
    };

    // Zoom functions
    const handleZoomIn = () => {
        setZoomState(prev => ({ 
            ...prev, 
            scale: Math.min(prev.scale * 1.2, 5) 
        }));
    };

    const handleZoomOut = () => {
        setZoomState(prev => ({ 
            ...prev, 
            scale: Math.max(prev.scale / 1.2, 0.5) 
        }));
    };

    const handleZoomReset = () => {
        setZoomState({ scale: 1, positionX: 0, positionY: 0 });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Pan functionality
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomState.scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - zoomState.positionX, y: e.clientY - zoomState.positionY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomState.scale > 1) {
            setZoomState(prev => ({
                ...prev,
                positionX: e.clientX - dragStart.x,
                positionY: e.clientY - dragStart.y
            }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle wheel zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    if (!selectedImage || selectedImage.status !== 'completed') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 glass-panel-pro rounded-t-2xl">
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
                        <h2 className="text-lg font-semibold text-white">{selectedImage.file.name}</h2>
                        <p className="text-sm text-white/70">
                            {selectedImage.originalDimensions.width} × {selectedImage.originalDimensions.height} → 
                            {selectedImage.originalDimensions.width * 4} × {selectedImage.originalDimensions.height * 4}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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

                    {/* Zoom Controls */}
                    <div className="hidden sm:flex bg-white/10 rounded-lg p-1">
                        <ActionButton
                            onClick={handleZoomOut}
                            variant="secondary"
                            className="p-1.5"
                            title="Zoom out"
                        >
                            <ZoomOutIcon className="h-4 w-4" />
                        </ActionButton>
                        <div className="px-2 py-1.5 text-xs text-white min-w-[3rem] text-center">
                            {Math.round(zoomState.scale * 100)}%
                        </div>
                        <ActionButton
                            onClick={handleZoomIn}
                            variant="secondary"
                            className="p-1.5"
                            title="Zoom in"
                        >
                            <ZoomInIcon className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton
                            onClick={handleZoomReset}
                            variant="secondary"
                            className="p-1.5"
                            title="Reset zoom"
                        >
                            <ResetIcon className="h-4 w-4" />
                        </ActionButton>
                    </div>

                    <ActionButton
                        onClick={toggleFullscreen}
                        variant="secondary"
                        className="p-2"
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? <CompressIcon className="h-5 w-5" /> : <ExpandIcon className="h-5 w-5" />}
                    </ActionButton>

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
            <div className="flex-1 relative overflow-hidden" ref={imageRef}>
                <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{
                        transform: `scale(${zoomState.scale}) translate(${zoomState.positionX / zoomState.scale}px, ${zoomState.positionY / zoomState.scale}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        cursor: zoomState.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                >
                    <AnimatePresence mode="wait">
                        {comparisonMode === 'slider' && (
                            <motion.div
                                key="slider"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full max-w-7xl max-h-full relative"
                            >
                                <img
                                    src={selectedImage.originalDataUrl}
                                    alt="Original"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                                    <img
                                        src={selectedImage.upscaledDataUrl!}
                                        alt="Enhanced"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <input
                                    type="range" min="0" max="100" value={sliderPosition}
                                    onChange={(e) => handleSliderPositionChange(parseInt(e.target.value, 10))}
                                    className="absolute inset-0 w-full h-full cursor-ew-resize appearance-none bg-transparent
                                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:bg-white/80 [&::-webkit-slider-thumb]:shadow-lg
                                               hover:[&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:shadow-white/40"
                                    aria-label="Before and after comparison slider"
                                />
                                <div className="absolute top-0 bottom-0 bg-white/80 w-0.5 pointer-events-none hover:bg-white transition-colors" style={{ left: `calc(${sliderPosition}% - 1px)` }}>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-12 w-12 rounded-full border-2 border-white/20 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 bg-white/90"
                                    >
                                        <svg className="w-6 h-6 text-gray-700 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    Original
                                </div>
                                <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    Enhanced
                                </div>
                            </motion.div>
                        )}
                        
                        {comparisonMode === 'side-by-side' && (
                            <motion.div
                                key="side-by-side"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full max-w-7xl max-h-full flex"
                            >
                                <div className="w-1/2 relative">
                                    <img
                                        src={selectedImage.originalDataUrl}
                                        alt="Original"
                                        className="w-full h-full object-contain"
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
                                className="w-full h-full max-w-7xl max-h-full relative"
                            >
                                <img
                                    src={selectedImage.originalDataUrl}
                                    alt="Original"
                                    className="w-full h-full object-contain"
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
                                        <EyeIcon className="h-12 w-12 mx-auto mb-3" />
                                        <div className="text-lg font-medium">Hover to see enhanced</div>
                                    </div>
                                </div>
                                <img
                                    src={selectedImage.upscaledDataUrl!}
                                    alt="Enhanced"
                                    className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-300"
                                    style={{ pointerEvents: 'none' }}
                                />
                                <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm opacity-0" style={{ pointerEvents: 'none' }}>
                                    Enhanced
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        {hasPrevious && (
                            <ActionButton
                                onClick={handlePrevious}
                                variant="secondary"
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white"
                                title="Previous image (Left Arrow)"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </ActionButton>
                        )}
                        
                        {hasNext && (
                            <ActionButton
                                onClick={handleNext}
                                variant="secondary"
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white"
                                title="Next image (Right Arrow)"
                            >
                                <ArrowRightIcon className="h-5 w-5" />
                            </ActionButton>
                        )}
                    </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                {/* Zoom Indicator */}
                {zoomState.scale > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm">
                        Zoom: {Math.round(zoomState.scale * 100)}%
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

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm max-w-xs">
                <div className="font-medium mb-1">Keyboard Shortcuts:</div>
                <div className="space-y-0.5">
                    <div>← → Navigate images</div>
                    <div>Space Change view</div>
                    <div>+ - Zoom in/out</div>
                    <div>0 Reset zoom</div>
                    <div>F Fullscreen</div>
                    <div>Esc Close</div>
                </div>
            </div>

        </motion.div>
    );
};