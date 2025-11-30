import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernImageCard } from './ModernImageCard';
import { useAppContext } from '../context/AppContext';

export const ImageCentricThumbnailGrid: React.FC = () => {
    const { images, setSelectedImageId, setIsFullScreenComparison } = useAppContext();
    const galleryRef = useRef<HTMLDivElement>(null);
    const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Set up intersection observer for lazy loading
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const imageId = entry.target.getAttribute('data-image-id');
                    if (imageId && entry.isIntersecting) {
                        setVisibleImages((prev) => new Set(prev).add(imageId));
                        
                        // Stop observing once visible
                        if (observerRef.current) {
                            observerRef.current.unobserve(entry.target);
                        }
                    }
                });
            },
            {
                root: galleryRef.current,
                rootMargin: '100px', // Start loading 100px before entering viewport
                threshold: 0.1
            }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Observe new images when they are added
    useEffect(() => {
        if (observerRef.current) {
            const imageElements = galleryRef.current?.querySelectorAll('[data-image-id]');
            imageElements?.forEach((el) => {
                const imageId = el.getAttribute('data-image-id');
                if (imageId && !visibleImages.has(imageId)) {
                    observerRef.current?.observe(el);
                }
            });
        }
    }, [images, visibleImages]);

    // Handle image load event
    const handleImageLoad = useCallback((imageId: string) => {
        setLoadedImages((prev) => new Set(prev).add(imageId));
    }, []);

    // Handle image selection for comparison view
    const handleImageSelect = useCallback((imageId: string) => {
        setSelectedImageId(imageId);
        setIsFullScreenComparison(true);
    }, [setSelectedImageId, setIsFullScreenComparison]);

    // Container variants for staggered animations
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    // Item variants for individual cards
    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        show: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Gallery Header */}
            <motion.div
                className="px-4 lg:px-6 py-4 border-b border-[var(--color-panel-border)]/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">Image Enhancement</h2>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            {images.length} {images.length === 1 ? 'image' : 'images'} ready for enhancement
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <div className="hidden sm:flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span>{images.filter(i => i.status === 'completed').length} Enhanced</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <span>{images.filter(i => i.status === 'upscaling').length} Processing</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <span>{images.filter(i => i.status === 'pending').length} Queued</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Centered Image View */}
            <div ref={galleryRef} className="flex-1 overflow-hidden p-4 lg:p-6">
                <AnimatePresence mode="wait">
                    {images.length === 0 ? (
                        <motion.div
                            className="h-full flex items-center justify-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="text-center max-w-md">
                                <motion.div
                                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-panel-bg)] border border-[var(--color-panel-border)] flex items-center justify-center"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.3 }}
                                >
                                    <svg className="w-10 h-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </motion.div>
                                <motion.h3
                                    className="text-xl font-medium text-[var(--color-text)] mb-3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                >
                                    No images yet
                                </motion.h3>
                                <motion.p
                                    className="text-sm text-[var(--color-text-muted)] mb-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                >
                                    Upload some images to get started with AI enhancement
                                </motion.p>
                                <motion.div
                                    className="flex flex-col gap-2 text-left bg-[var(--color-panel-bg)] border border-[var(--color-panel-border)] rounded-lg p-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.3 }}
                                >
                                    <h4 className="font-medium text-[var(--color-text)] mb-2">How it works:</h4>
                                    <ol className="text-sm text-[var(--color-text-muted)] space-y-1 list-decimal list-inside">
                                        <li>Upload your images using the Add button</li>
                                        <li>Adjust enhancement settings in the floating panel</li>
                                        <li>Click "Enhance All" to process your images</li>
                                        <li>Click on enhanced images to compare before/after</li>
                                        <li>Download your enhanced images</li>
                                    </ol>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            className="h-full flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="w-full max-w-6xl mx-auto">
                                {images.length === 1 ? (
                                    // Single image - show it centered and larger
                                    <motion.div
                                        key={images[0].id}
                                        data-image-id={images[0].id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{
                                            opacity: loadedImages.has(images[0].id) ? 1 : 0,
                                            scale: loadedImages.has(images[0].id) ? 1 : 0.9,
                                            y: loadedImages.has(images[0].id) ? 0 : 20,
                                        }}
                                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                        transition={{
                                            duration: 0.4,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30
                                        }}
                                        className="h-full max-h-[80vh] flex items-center justify-center"
                                        onMouseEnter={() => setHoveredImageId(images[0].id)}
                                        onMouseLeave={() => setHoveredImageId(null)}
                                    >
                                        <div className="w-full max-w-4xl">
                                            <ModernImageCard
                                                image={images[0]}
                                                lazyLoad={!visibleImages.has(images[0].id)}
                                                onImageLoad={handleImageLoad}
                                                onImageSelect={handleImageSelect}
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    // Multiple images - show in a grid
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                        {images.slice(0, 6).map((image, index) => (
                                            <motion.div
                                                key={image.id}
                                                data-image-id={image.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{
                                                    opacity: loadedImages.has(image.id) ? 1 : 0,
                                                    scale: loadedImages.has(image.id) ? 1 : 0.9,
                                                    y: loadedImages.has(image.id) ? 0 : 20,
                                                }}
                                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: index * 0.1,
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 30
                                                }}
                                                className="h-full"
                                                onMouseEnter={() => setHoveredImageId(image.id)}
                                                onMouseLeave={() => setHoveredImageId(null)}
                                                whileHover={{ zIndex: 10 }}
                                            >
                                                <ModernImageCard
                                                    image={image}
                                                    lazyLoad={!visibleImages.has(image.id)}
                                                    onImageLoad={handleImageLoad}
                                                    onImageSelect={handleImageSelect}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Show more images indicator */}
                                {images.length > 6 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-6 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-panel-bg)] border border-[var(--color-panel-border)] rounded-lg">
                                            <span className="text-sm text-[var(--color-text-muted)]">
                                                +{images.length - 6} more {images.length - 6 === 1 ? 'image' : 'images'}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};