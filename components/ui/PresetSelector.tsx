import React from 'react';
import { useAppContext } from '../../context/AppContext';
import type { EnhancedUpscaleSettings } from '../../types';

interface PresetOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    settings: Partial<EnhancedUpscaleSettings>;
}

const presets: PresetOption[] = [
    {
        id: 'photo',
        name: 'Photography',
        description: 'Best for real-world photos',
        icon: '📷',
        settings: {
            mode: 'photorealistic',
            detailLevel: 'enhanced',
            colorProfile: 'natural',
            noiseReduction: 30,
            contrastAdjustment: 10,
            sharpening: 40,
            colorCorrection: true,
            modelSelection: 'real-esrgan',
            qualityVsSpeed: 'balanced'
        }
    },
    {
        id: 'artwork',
        name: 'Artwork',
        description: 'Optimized for illustrations',
        icon: '🎨',
        settings: {
            mode: 'creative',
            detailLevel: 'maximum',
            colorProfile: 'vibrant',
            noiseReduction: 10,
            contrastAdjustment: 20,
            sharpening: 60,
            colorCorrection: true,
            modelSelection: 'swinir',
            qualityVsSpeed: 'quality'
        }
    },
    {
        id: 'face',
        name: 'Portrait',
        description: 'Enhances facial features',
        icon: '👤',
        settings: {
            mode: 'photorealistic',
            detailLevel: 'enhanced',
            colorProfile: 'natural',
            noiseReduction: 20,
            contrastAdjustment: 5,
            sharpening: 30,
            colorCorrection: true,
            modelSelection: 'gfpgan',
            qualityVsSpeed: 'quality'
        }
    },
    {
        id: 'text',
        name: 'Document',
        description: 'Sharp text and graphics',
        icon: '📄',
        settings: {
            mode: 'photorealistic',
            detailLevel: 'maximum',
            colorProfile: 'natural',
            noiseReduction: 40,
            contrastAdjustment: 30,
            sharpening: 80,
            colorCorrection: false,
            modelSelection: 'real-esrgan',
            qualityVsSpeed: 'speed'
        }
    }
];

export const PresetSelector: React.FC = () => {
    const { settings, setSettings } = useAppContext();

    const applyPreset = (preset: PresetOption) => {
        setSettings(prev => ({ ...prev, ...preset.settings }));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className="p-3 bg-black/20 border border-[var(--color-panel-border)] rounded-lg hover:bg-black/30 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{preset.icon}</span>
                            <span className="text-sm font-medium text-[var(--color-text)]">{preset.name}</span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">{preset.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};