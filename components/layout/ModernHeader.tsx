import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog6ToothIcon, SparklesIcon, UploadIcon, XMarkIcon } from '../Icons';
import { useAppContext } from '../../context/AppContext';
import { useImageProcessor } from '../../hooks/useImageProcessor';
import { ActionButton } from '../ui/ActionButton';

const AIPoweredBadge: React.FC = () => (
    <div className="hidden sm:flex items-center gap-1.5 bg-black/20 text-[var(--color-primary-light)] px-2.5 py-1 rounded-full text-xs font-semibold border border-[var(--color-panel-border)] glow-pulse">
        <SparklesIcon className="h-3.5 w-3.5 rotate-slow" />
        <span>Enhanced</span>
    </div>
);

export const ModernHeader: React.FC = () => {
    const { images, isControlsOpen, setIsControlsOpen, isProcessing, viewMode, setViewMode, selectedImageId, setSelectedImageId } = useAppContext();
    const { handleFiles } = useImageProcessor();
    
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (e.target) {
            e.target.value = ''; // Allow re-selecting the same file
        }
    };

    const progressInfo = React.useMemo(() => {
        const pending = images.filter(i => i.status === 'pending').length;
        const processing = images.filter(i => i.status === 'upscaling').length;
        const completed = images.filter(i => i.status === 'completed').length;
        const errors = images.filter(i => i.status === 'error' || i.status === 'size-error').length;
        const total = images.length;
        return { pending, processing, completed, errors, total };
    }, [images]);

    const overallProgress = progressInfo.total > 0 ? ((progressInfo.completed + progressInfo.errors) / progressInfo.total) * 100 : 0;
    const hasImages = images.length > 0;

    const handleBackToGallery = () => {
        setViewMode('gallery');
        setSelectedImageId(null);
    };

    return (
        <header className="relative z-20 glass-panel-elevated border-b border-[var(--color-panel-border-strong)]">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-panel-border)]/30 overflow-hidden">
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            className="h-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${overallProgress}%` }}
                            exit={{ width: '100%' }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                    )}
                </AnimatePresence>
            </div>
            
            <div className="flex items-center justify-between px-6 py-4 lg:px-8 lg:py-5">
                {/* Logo and Brand Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                    className="flex items-center gap-6"
                >
                    {viewMode === 'comparison' && (
                        <ActionButton
                            onClick={handleBackToGallery}
                            variant="secondary"
                            className="p-2.5 rounded-lg"
                            title="Back to gallery"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </ActionButton>
                    )}
                    
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/25"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <SparklesIcon className="h-7 w-7 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="hero-title text-3xl lg:text-4xl font-extrabold hero-title-gradient leading-tight">
                                Flurry AI
                            </h1>
                            <p className="text-sm text-[var(--color-text-secondary)] hidden sm:block mt-0.5">
                                {viewMode === 'comparison' ? 'Image Comparison' : 'Professional Image Enhancement'}
                            </p>
                        </div>
                    </div>
                    <AIPoweredBadge />
                </motion.div>
                
                {/* Center Status Section */}
                {hasImages && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="hidden lg:flex items-center gap-4"
                    >
                        <motion.div
                            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] backdrop-blur-sm hover-lift"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></div>
                            <span className="text-sm font-semibold text-[var(--color-text)]">{progressInfo.completed}</span>
                            <span className="text-xs text-[var(--color-text-secondary)]">Completed</span>
                        </motion.div>
                        <motion.div
                            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] backdrop-blur-sm hover-lift"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-sm shadow-blue-400/50"></div>
                            <span className="text-sm font-semibold text-[var(--color-text)]">{progressInfo.processing}</span>
                            <span className="text-xs text-[var(--color-text-secondary)]">Processing</span>
                        </motion.div>
                        <motion.div
                            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] backdrop-blur-sm hover-lift"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50"></div>
                            <span className="text-sm font-semibold text-[var(--color-text)]">{progressInfo.pending}</span>
                            <span className="text-xs text-[var(--color-text-secondary)]">Queued</span>
                        </motion.div>
                        {progressInfo.errors > 0 && (
                            <motion.div
                                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm hover-lift"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/50"></div>
                                <span className="text-sm font-semibold text-red-400">{progressInfo.errors}</span>
                                <span className="text-xs text-red-300">Errors</span>
                            </motion.div>
                        )}
                    </motion.div>
                )}
                
                {/* Action Buttons Section */}
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {hasImages && viewMode === 'gallery' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <ActionButton
                                    isFileInput
                                    onFileChange={onFileChange}
                                    variant="secondary"
                                    className="px-4 py-2.5 text-sm font-medium rounded-lg"
                                >
                                    <UploadIcon className="h-4 w-4 lg:h-5 lg:w-5"/>
                                    <span className="hidden sm:inline">Add Images</span>
                                </ActionButton>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Settings Toggle */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        onClick={() => setIsControlsOpen(!isControlsOpen)}
                        className={`glass-panel p-2.5 rounded-lg transition-all duration-300 magnetic-button ${isControlsOpen ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'hover:bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)]'}`}
                        aria-label="Toggle settings panel"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Cog6ToothIcon className={`h-5 w-5 ${isControlsOpen ? 'animate-spin' : ''}`} />
                    </motion.button>
                </div>
            </div>
            
            {/* Mobile Status Bar */}
            {hasImages && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:hidden px-6 pb-4 flex items-center justify-around text-xs"
                >
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-[var(--color-text-secondary)] font-medium">{progressInfo.completed}</span>
                        <span className="text-[var(--color-text-muted)]">Done</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="text-[var(--color-text-secondary)] font-medium">{progressInfo.processing}</span>
                        <span className="text-[var(--color-text-muted)]">Work</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="text-[var(--color-text-secondary)] font-medium">{progressInfo.pending}</span>
                        <span className="text-[var(--color-text-muted)]">Wait</span>
                    </div>
                    {progressInfo.errors > 0 && (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <span className="text-red-400 font-medium">{progressInfo.errors}</span>
                            <span className="text-red-300">Err</span>
                        </div>
                    )}
                </motion.div>
            )}
        </header>
    );
}