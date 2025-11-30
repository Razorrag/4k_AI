import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { ProcessedImage, UpscaleSettings, EnhancedUpscaleSettings } from '../types';

interface AppContextType {
    images: ProcessedImage[];
    setImages: React.Dispatch<React.SetStateAction<ProcessedImage[]>>;
    updateImage: (id: string, update: Partial<Omit<ProcessedImage, 'id'>>) => void;
    isProcessing: boolean;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    isControlsOpen: boolean;
    setIsControlsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isDragging: boolean;
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
    // Update settings type to EnhancedUpscaleSettings
    settings: EnhancedUpscaleSettings;
    setSettings: React.Dispatch<React.SetStateAction<EnhancedUpscaleSettings>>;
    // New view state properties
    viewMode: 'gallery' | 'comparison';
    setViewMode: React.Dispatch<React.SetStateAction<'gallery' | 'comparison'>>;
    selectedImageId: string | null;
    setSelectedImageId: React.Dispatch<React.SetStateAction<string | null>>;
    // Full-screen comparison state
    isFullScreenComparison: boolean;
    setIsFullScreenComparison: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const ImageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [images, setImages] = useState<ProcessedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'gallery' | 'comparison'>('gallery');
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [isFullScreenComparison, setIsFullScreenComparison] = useState<boolean>(false);
    const [settings, setSettings] = useState<EnhancedUpscaleSettings>({
        factor: '4x',
        mode: 'photorealistic',
        negativePrompt: 'blurry, noisy, jpeg artifacts, low-resolution, oversaturated',
        detailLevel: 'enhanced',
        colorProfile: 'vibrant',
        textureSynthesis: true,
        // Add new settings with sensible defaults
        noiseReduction: 20,
        contrastAdjustment: 0,
        brightnessAdjustment: 0,
        gammaCorrection: 1.0,
        sharpening: 30,
        colorCorrection: true,
        gammaAdjustment: 1.0,
        artifactReduction: 30,
        contentAwareProcessing: true,
        modelSelection: 'auto',
        qualityVsSpeed: 'balanced',
    });

    useEffect(() => {
        // Collapse sidebar by default on smaller screens
        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        setIsControlsOpen(!mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsControlsOpen(!e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    const updateImage = useCallback((id: string, update: Partial<Omit<ProcessedImage, 'id'>>) => {
        setImages(currentImages => currentImages.map(img => 
            img.id === id ? { ...img, ...update } : img
        ));
    }, []);

    const value = {
        images, setImages, updateImage,
        isProcessing, setIsProcessing,
        isControlsOpen, setIsControlsOpen,
        isDragging, setIsDragging,
        settings, setSettings,
        viewMode, setViewMode,
        selectedImageId, setSelectedImageId,
        isFullScreenComparison, setIsFullScreenComparison,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an ImageProvider');
    }
    return context;
};