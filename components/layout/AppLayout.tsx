import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { useImageProcessor } from '../../hooks/';
import { errorHandlingService } from '../../services/errorHandlingService';
import { ModernHeader } from './ModernHeader';
import { Footer } from './Footer';
import { Controls } from '../Controls';
import { EmptyState } from '../EmptyState';
import { ImageCentricThumbnailGrid } from '../ImageCentricThumbnailGrid';
import { EnhancedImageComparison } from '../EnhancedImageComparison';
import { BottomActionBar } from '../BottomActionBar';
import { FullScreenComparison } from '../FullScreenComparison';

export const AppLayout: React.FC = () => {
    const {
        images,
        isDragging,
        viewMode,
        selectedImageId,
        isFullScreenComparison,
        setIsFullScreenComparison,
        isControlsOpen,
        setIsControlsOpen
    } = useAppContext();

    const { handleFiles } = useImageProcessor();
    const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        // Check browser compatibility on mount
        const error = errorHandlingService.checkBrowserCompatibility();
        if (error) {
            setCompatibilityError(errorHandlingService.getErrorMessage(error));
            errorHandlingService.logError(error);
        }
    }, []);

    return (
        <div className={`bg-[#0D1B1E] text-white h-screen w-screen overflow-hidden ${isDragging ? 'drag-active' : ''}`}>
            {/* Main App Shell - Grid Layout */}
            <div className="relative z-10 grid h-full grid-rows-[auto_1fr] grid-cols-[auto_1fr] bg-black/20 backdrop-blur-sm">
                {/* Header - Spans full width */}
                <header className="col-span-2 row-start-1 z-20">
                    <ModernHeader />
                </header>

                {/* Left Sidebar - Controls Panel */}
                <aside className={`row-start-2 z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-0' : 'w-80'}`}>
                    <AnimatePresence>
                        {isControlsOpen && !isSidebarCollapsed && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: '320px', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <Controls />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </aside>

                {/* Main Content Area */}
                <main className="col-start-2 row-start-2 overflow-hidden relative flex flex-col z-10">
                    {/* Compatibility Error */}
                    {compatibilityError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-0 left-0 right-0 z-50 glass-panel border-red-500/50 text-red-300 p-4"
                        >
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-lg font-bold mb-2">Browser Compatibility Issue</h3>
                                <p className="text-sm whitespace-pre-line">{compatibilityError}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Content Area */}
                    <div className="flex-grow overflow-y-auto p-4 lg:p-8">
                        {images.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex items-center justify-center"
                            >
                                <EmptyState onFilesSelected={handleFiles} />
                            </motion.div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {viewMode === 'gallery' ? (
                                    <motion.div
                                        key="gallery"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-full max-w-7xl mx-auto"
                                    >
                                        <ImageCentricThumbnailGrid />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="comparison"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full"
                                    >
                                        <EnhancedImageComparison />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Bottom Action Bar - Fixed to bottom of main content */}
                    {images.length > 0 && <BottomActionBar />}

                    {/* Footer */}
                    <div className="z-30">
                        <Footer />
                    </div>
                </main>

            </div>

            {/* Floating Toggle Button for Sidebar (when collapsed) */}
            <AnimatePresence>
                {!isControlsOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsControlsOpen(true)}
                        className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 flex items-center justify-center border border-[var(--color-panel-border)]"
                        aria-label="Open enhancement settings"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Full Screen Comparison Modal - Highest z-index */}
            <div className="fixed inset-0 z-50">
                <AnimatePresence>
                    {isFullScreenComparison && selectedImageId && (
                        <FullScreenComparison
                            imageId={selectedImageId}
                            onClose={() => setIsFullScreenComparison(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};