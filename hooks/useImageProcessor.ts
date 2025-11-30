import React, { useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { uploadImage, checkStatus, getResultUrl } from '../api/client';
import type { ProcessedImage } from '../types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (matches backend)

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ width: 0, height: 0 });
        };
        img.src = url;
    });
};

export const useImageProcessor = () => {
    const {
        images,
        setImages,
        settings,
        isProcessing,
        setIsProcessing,
        setIsDragging,
        updateImage,
    } = useAppContext();
    
    const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files) return;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        const newImagesPromises = imageFiles.map(async (file): Promise<ProcessedImage> => {
            const originalUrl = URL.createObjectURL(file);
            const { width, height } = await getImageDimensions(file);
            
            // Check for file size issues
            if (file.size > MAX_FILE_SIZE) {
                return {
                    id: `${file.name}-${Date.now()}-${Math.random()}`,
                    originalUrl,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    width,
                    height,
                    status: 'error',
                    error: `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is 50 MB.`,
                };
            }

            return {
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                originalUrl,
                name: file.name,
                size: file.size,
                type: file.type,
                width,
                height,
                status: 'pending',
            };
        });

        const newImages = await Promise.all(newImagesPromises);
        setImages(prev => [...prev, ...newImages]);
    }, [setImages]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles, setIsDragging]);

    const handleDragEvent = useCallback((e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsDragging(isEntering);
    }, [setIsDragging]);
    
    // Poll for job status
    const pollJobStatus = useCallback((imageId: string, jobId: string) => {
        const poll = async () => {
            try {
                const status = await checkStatus(jobId);
                
                if (status.status === 'completed') {
                    updateImage(imageId, {
                        status: 'completed',
                        enhancedUrl: getResultUrl(jobId),
                    });
                    pollingRefs.current.delete(imageId);
                } else if (status.status === 'failed') {
                    updateImage(imageId, {
                        status: 'error',
                        error: status.error || 'Processing failed',
                    });
                    pollingRefs.current.delete(imageId);
                } else {
                    // Still processing, continue polling
                    const timeoutId = setTimeout(poll, 2000);
                    pollingRefs.current.set(imageId, timeoutId);
                }
            } catch (err) {
                console.error('Status poll failed:', err);
                // Retry on error
                const timeoutId = setTimeout(poll, 5000);
                pollingRefs.current.set(imageId, timeoutId);
            }
        };
        poll();
    }, [updateImage]);

    const processImage = async (imageToProcess: ProcessedImage) => {
        updateImage(imageToProcess.id, { status: 'processing' });
        
        try {
            // Get the file from the blob URL
            const response = await fetch(imageToProcess.originalUrl);
            const blob = await response.blob();
            const file = new File([blob], imageToProcess.name, { type: imageToProcess.type });
            
            // Upload to backend
            const uploadResult = await uploadImage(file);
            
            // Start polling for status
            pollJobStatus(imageToProcess.id, uploadResult.job_id);
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            updateImage(imageToProcess.id, {
                status: 'error',
                error: errorMessage,
            });
        }
    };
    
    const upscaleAll = async () => {
        setIsProcessing(true);
        const pendingImages = images.filter(i => i.status === 'pending');
        
        for (const imageToProcess of pendingImages) {
            await processImage(imageToProcess);
            // Small delay between uploads
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        setIsProcessing(false);
    };
    
    const retryImage = async (id: string) => {
        const imageToRetry = images.find(i => i.id === id);
        if (!imageToRetry || isProcessing) return;
        
        // Reset status to pending first
        updateImage(id, { status: 'pending', error: undefined });
        
        setIsProcessing(true);
        await processImage(imageToRetry);
        setIsProcessing(false);
    };

    const resetQueue = () => {
        // Stop all polling
        pollingRefs.current.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        pollingRefs.current.clear();
        
        // Revoke blob URLs
        images.forEach(image => {
            URL.revokeObjectURL(image.originalUrl);
        });
        setImages([]);
        setIsProcessing(false);
    };
  
    const removeImage = (id: string) => {
        // Stop polling for this image
        const timeoutId = pollingRefs.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            pollingRefs.current.delete(id);
        }
        
        const imageToRemove = images.find(img => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.originalUrl);
        }
        setImages(prev => prev.filter(i => i.id !== id));
    };

    // Batch export function
    const batchExport = async () => {
        const completedImages = images.filter(i => i.status === 'completed' && i.enhancedUrl);
        
        if (completedImages.length === 0) {
            console.warn('No completed images to export');
            return;
        }
        
        // Create a zip file with all enhanced images
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        for (const image of completedImages) {
            if (!image.enhancedUrl) continue;
            
            try {
                const response = await fetch(image.enhancedUrl);
                const blob = await response.blob();
                
                // Get name without extension and add enhanced suffix
                const nameParts = image.name.split('.');
                const ext = nameParts.pop() || 'jpg';
                const name = nameParts.join('.');
                const fileName = `${name}-enhanced-${settings.factor}.${ext}`;
                
                zip.file(fileName, blob);
            } catch (err) {
                console.error(`Failed to add ${image.name} to zip:`, err);
            }
        }
        
        // Generate and download the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `enhanced-images-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(zipUrl);
    };

    // Undo/reset to original
    const undoEnhancement = (id: string) => {
        updateImage(id, {
            status: 'pending',
            enhancedUrl: undefined,
            error: undefined,
        });
    };

    return {
        handleFiles,
        handleDrop,
        handleDragEvent,
        upscaleAll,
        retryImage,
        resetQueue,
        removeImage,
        batchExport,
        undoEnhancement,
    };
};