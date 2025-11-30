import React, { useState, useCallback, ChangeEvent } from 'react';
import { motion, type Variants } from 'framer-motion';
import { UploadIcon, SparklesIcon } from './Icons';

interface EmptyStateProps {
    onFilesSelected: (files: FileList | null) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onFilesSelected }) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        onFilesSelected(e.target.files);
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        onFilesSelected(e.dataTransfer.files);
    }, [onFilesSelected]);

    const handleDragEvent = useCallback((e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(isEntering);
    }, []);

    // FIX: Explicitly type containerVariants with Variants from framer-motion to fix type inference issue.
    const containerVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.5, delay: 0.4, type: 'spring' }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onDrop={(e) => handleDrop(e)}
            onDragOver={(e) => handleDragEvent(e, true)}
            onDragEnter={(e) => handleDragEvent(e, true)}
            onDragLeave={(e) => handleDragEvent(e, false)}
            className="w-full h-full flex items-center justify-center p-4 lg:p-8"
        >
            <div className="w-full max-w-4xl">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/20 backdrop-blur-sm mb-8 glow-pulse"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <SparklesIcon className="h-5 w-5 text-[var(--color-primary-light)] rotate-slow" />
                        <span className="text-sm font-semibold text-[var(--color-primary-light)]">AI-Powered Enhancement</span>
                    </motion.div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold hero-title-gradient mb-8 leading-tight">
                        Transform Your Images
                        <br />
                        <span className="text-4xl sm:text-5xl lg:text-6xl text-[var(--color-primary-light)] font-semibold">With AI Precision</span>
                    </h1>
                    <p className="text-xl sm:text-2xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed font-light">
                        Experience the future of image enhancement. Our advanced AI technology upscales your images while preserving quality and adding stunning detail.
                    </p>
                </motion.div>

                {/* Upload Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="relative"
                >
                    <motion.div
                        className={`relative overflow-hidden glass-panel-pro rounded-3xl border-2 transition-all duration-500 ${
                            isDragging
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-2xl shadow-[var(--color-primary)]/30'
                                : 'border-dashed border-[var(--color-panel-border)] hover:border-[var(--color-primary)]/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <input
                            type="file"
                            multiple
                            onChange={onFileChange}
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            aria-label="Upload images"
                        />
                        
                        <div className="p-8 sm:p-12 lg:p-16 xl:p-20">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="text-center"
                            >
                                {/* Animated Upload Icon */}
                                <motion.div
                                    animate={{
                                        y: [0, -15, 0],
                                        rotate: [0, 5, 0, -5, 0],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-28 h-28 mx-auto mb-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 backdrop-blur-sm glow-pulse"
                                >
                                    <UploadIcon className="w-14 h-14 text-[var(--color-primary-light)]" />
                                </motion.div>

                                <div className="mb-10">
                                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                        {isDragging ? 'Drop your images here' : 'Drag & Drop Your Images'}
                                    </h2>
                                    <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] font-light">
                                        or click to browse from your computer
                                    </p>
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn btn-primary btn-lg btn-shine px-10 py-4 rounded-xl font-bold text-lg mb-10 magnetic-button"
                                >
                                    <span className="relative flex items-center gap-3">
                                        <UploadIcon className="w-6 h-6" />
                                        Choose Images
                                    </span>
                                </motion.button>

                                {/* Features Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
                                    <motion.div
                                        className="flex flex-col items-center p-6 rounded-2xl bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] backdrop-blur-sm interactive-card"
                                        whileHover={{ y: -5 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-primary)]/10 flex items-center justify-center mb-3 glow-pulse"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <svg className="w-7 h-7 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </motion.div>
                                        <span className="text-base font-semibold text-[var(--color-text)]">2x & 4x Upscale</span>
                                    </motion.div>
                                    <motion.div
                                        className="flex flex-col items-center p-6 rounded-2xl bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] backdrop-blur-sm interactive-card"
                                        whileHover={{ y: -5 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-primary)]/10 flex items-center justify-center mb-3 glow-pulse"
                                            whileHover={{ scale: 1.1, rotate: -5 }}
                                        >
                                            <svg className="w-7 h-7 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </motion.div>
                                        <span className="text-base font-semibold text-[var(--color-text)]">AI Enhancement</span>
                                    </motion.div>
                                    <motion.div
                                        className="flex flex-col items-center p-6 rounded-2xl bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] backdrop-blur-sm interactive-card"
                                        whileHover={{ y: -5 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-primary)]/10 flex items-center justify-center mb-3 glow-pulse"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <svg className="w-7 h-7 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </motion.div>
                                        <span className="text-base font-semibold text-[var(--color-text)]">Fast Processing</span>
                                    </motion.div>
                                </div>

                                {/* File Info */}
                                <div className="mt-10 space-y-3 max-w-md mx-auto">
                                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                        <span className="font-medium">Supported formats:</span>
                                        <span className="px-2 py-1 bg-[var(--color-glass-bg)] rounded-md">JPG</span>
                                        <span className="px-2 py-1 bg-[var(--color-glass-bg)] rounded-md">PNG</span>
                                        <span className="px-2 py-1 bg-[var(--color-glass-bg)] rounded-md">WEBP</span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)] text-center">
                                        <span className="font-medium">Maximum file size:</span> 20MB per image
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]/70 text-center mt-4">
                                        For best results, use high-quality source images
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};