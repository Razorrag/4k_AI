import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog6ToothIcon, SparklesIcon, TrashIcon, UploadIcon, WandIcon } from '../Icons';
import { useAppContext } from '../../context/AppContext';
import { useImageProcessor } from '../../hooks/useImageProcessor';
import { ActionButton } from '../ui/ActionButton';

const AIPoweredBadge: React.FC = () => (
    <div className="hidden sm:flex items-center gap-1.5 bg-black/20 text-[var(--color-primary-light)] px-2.5 py-1 rounded-full text-xs font-semibold border border-[var(--color-panel-border)]">
        <WandIcon className="h-3.5 w-3.5" />
        <span>Enhanced</span>
    </div>
);

export const Header: React.FC = () => {
    const { images, isControlsOpen, setIsControlsOpen, isProcessing } = useAppContext();
    const { handleFiles, upscaleAll, resetQueue } = useImageProcessor();
    
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

    const pendingCount = progressInfo.pending;
    const processingCount = progressInfo.processing;
    const processedCount = progressInfo.completed + progressInfo.errors;
    const totalCount = progressInfo.total;
    const overallProgress = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;
    const hasImages = images.length > 0;

    return (
        <header className="relative z-20 glass-panel border-b border-[var(--color-panel-border)]">
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
            
            <div className="flex items-center justify-between p-4 lg:p-6">
                {/* Logo and Brand Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                    className="flex items-center gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center">
                            <SparklesIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="hero-title text-2xl lg:text-3xl font-extrabold hero-title-gradient">
                                Flurry AI
                            </h1>
                            <p className="text-xs text-[var(--color-text-muted)] hidden sm:block">Professional Image Enhancement</p>
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
                        className="hidden lg:flex items-center gap-6"
                    >
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-[var(--color-panel-border)]">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-sm font-medium text-[var(--color-text)]">{progressInfo.completed}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">Completed</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-[var(--color-panel-border)]">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                            <span className="text-sm font-medium text-[var(--color-text)]">{progressInfo.processing}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">Processing</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-[var(--color-panel-border)]">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <span className="text-sm font-medium text-[var(--color-text)]">{progressInfo.pending}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">Queued</span>
                        </div>
                        {progressInfo.errors > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <span className="text-sm font-medium text-red-400">{progressInfo.errors}</span>
                                <span className="text-xs text-red-300">Errors</span>
                            </div>
                        )}
                    </motion.div>
                )}
                
                {/* Action Buttons Section */}
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {hasImages && (
                            <motion.div
                                key="actions"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2"
                            >
                                <ActionButton
                                    isFileInput
                                    onFileChange={onFileChange}
                                    variant="secondary"
                                    className="px-3 py-2 lg:px-4 lg:py-2.5 text-sm"
                                >
                                    <UploadIcon className="h-4 w-4 lg:h-5 lg:w-5"/>
                                    <span className="hidden sm:inline">Add</span>
                                </ActionButton>
                                <ActionButton
                                    onClick={resetQueue}
                                    disabled={isProcessing}
                                    variant="danger"
                                    className="px-3 py-2 lg:px-4 lg:py-2.5 text-sm"
                                >
                                    <TrashIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                                    <span className="hidden sm:inline">Clear</span>
                                </ActionButton>
                                <div className="relative group">
                                    <ActionButton
                                        onClick={upscaleAll}
                                        disabled={isProcessing || pendingCount === 0}
                                        variant="primary"
                                        className="px-3 py-2 lg:px-4 lg:py-2.5 text-sm font-semibold"
                                    >
                                        <SparklesIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                                        {isProcessing ? 'Processing...' : `Enhance`}
                                    </ActionButton>
                                    {(!isProcessing && pendingCount === 0) && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                            Add images to enable enhancement
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Settings Toggle */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        onClick={() => setIsControlsOpen(!isControlsOpen)}
                        className={`glass-panel p-2.5 lg:p-3 rounded-xl transition-all duration-300 ${isControlsOpen ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'hover:bg-[var(--color-panel-bg)]'}`}
                        aria-label="Toggle settings panel"
                    >
                        <Cog6ToothIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                    </motion.button>
                </div>
            </div>
            
            {/* Mobile Status Bar */}
            {hasImages && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:hidden px-4 pb-3 flex items-center justify-around text-xs"
                >
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                        <span className="text-[var(--color-text-muted)]">{progressInfo.completed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        <span className="text-[var(--color-text-muted)]">{progressInfo.processing}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                        <span className="text-[var(--color-text-muted)]">{progressInfo.pending}</span>
                    </div>
                    {progressInfo.errors > 0 && (
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                            <span className="text-red-400">{progressInfo.errors}</span>
                        </div>
                    )}
                </motion.div>
            )}
        </header>
    );
}