import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrashIcon, UploadIcon, DownloadIcon } from './Icons';
import { ActionButton } from './ui/ActionButton';
import { useAppContext } from '../context/AppContext';
import { useImageProcessor } from '../hooks/useImageProcessor';


export const BottomActionBar: React.FC = () => {
    const { images, isProcessing } = useAppContext();
    const { handleFiles, upscaleAll, resetQueue, batchExport } = useImageProcessor();
    
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (e.target) {
            e.target.value = ''; // Allow re-selecting the same file
        }
    };
    
    const pendingCount = images.filter(i => i.status === 'pending').length;
    const completedCount = images.filter(i => i.status === 'completed').length;
    const imageCount = images.length;
    const hasCompletedImages = completedCount > 0;
    
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
    };

    return (
        <motion.div
            initial={{ y: "150%" }}
            animate={{ y: "0%" }}
            exit={{ y: "150%" }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20"
        >
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 shadow-2xl border border-[var(--color-panel-border)]/50" style={{ backgroundColor: 'var(--color-action-bar-bg)' }}>
                <AnimatePresence mode="wait">
                    {imageCount === 0 ? (
                         <motion.div key="upload" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                             <ActionButton isFileInput onFileChange={onFileChange} className="px-8 py-3 text-lg font-semibold">
                                 <UploadIcon className="h-6 w-6"/>
                                 <span>Upload Images</span>
                            </ActionButton>
                         </motion.div>
                    ) : (
                         <motion.div key="actions" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="flex items-center gap-3">
                            {/* Status Display */}
                            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-black/20 rounded-xl border border-[var(--color-panel-border)]/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <span className="text-sm font-medium text-[var(--color-text)]">{pendingCount}</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">Queued</span>
                                </div>
                                <div className="w-px h-4 bg-[var(--color-panel-border)]/50"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="text-sm font-medium text-[var(--color-text)]">{completedCount}</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">Completed</span>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <ActionButton
                                    onClick={batchExport}
                                    disabled={!hasCompletedImages}
                                    variant="secondary"
                                    className="px-4 py-2.5 text-sm"
                                >
                                    <DownloadIcon className="h-5 w-5" />
                                    <span className="hidden sm:inline">Export All</span>
                                </ActionButton>
                                
                                <ActionButton
                                    onClick={resetQueue}
                                    disabled={isProcessing}
                                    variant="danger"
                                    className="px-4 py-2.5 text-sm"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    <span className="hidden sm:inline">Clear</span>
                                </ActionButton>
                                
                                <ActionButton
                                    onClick={upscaleAll}
                                    disabled={isProcessing || pendingCount === 0}
                                    variant="primary"
                                    className="px-6 py-2.5 text-sm font-semibold relative"
                                >
                                    {isProcessing && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <span className={isProcessing ? 'opacity-0' : 'flex items-center gap-2'}>
                                        <SparklesIcon className="h-5 w-5" />
                                        <span>{isProcessing ? 'Processing...' : `Enhance (${pendingCount})`}</span>
                                    </span>
                                </ActionButton>
                            </div>
                            
                            {/* Mobile Status */}
                            <div className="lg:hidden flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                    <span>{pendingCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                    <span>{completedCount}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}