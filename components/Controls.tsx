import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cog6ToothIcon, WandIcon, SparklesIcon, AdjustmentsIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { useImageProcessor } from '../hooks/useImageProcessor';
import type { EnhancedUpscaleSettings } from '../types';
import { RangeSlider } from './ui/RangeSlider';
import { PresetSelector } from './ui/PresetSelector';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { Tooltip } from './ui/Tooltip';

const SettingsButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, isActive, children, className = '' }) => {

    const base = `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ease-in-out overflow-hidden relative`;

    return (
        <button onClick={onClick} className={`${base} ${isActive ? 'primary-button' : 'toggle-button-inactive'} ${className}`}>
            {isActive && <span className="shine"></span>}
            <span className="relative">{children}</span>
        </button>
    )
}

const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
}> = ({ label, value, min, max, step, onChange, formatValue }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-[var(--color-text-muted)]">
            <span>{label}</span>
            <span>{formatValue ? formatValue(value) : value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)]"
        />
    </div>
);

export const Controls: React.FC = () => {
    const { settings, setSettings, isControlsOpen, images, isProcessing } = useAppContext();
    const { resetQueue } = useImageProcessor();

    const updateSettings = (update: Partial<EnhancedUpscaleSettings>) => {
        setSettings(s => ({ ...s, ...update }));
    };

    const pendingCount = images.filter(i => i.status === 'pending').length;
    const processingCount = images.filter(i => i.status === 'processing').length;

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ width: isControlsOpen ? '320px' : '0px' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="h-full glass-panel overflow-hidden relative z-20 border-r border-[var(--color-panel-border)]"
            >
                <div className="h-full w-80 p-6 overflow-y-auto">
                    <div className="flex flex-col gap-6 h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center">
                                    <Cog6ToothIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--color-text)]">Enhancement</h2>
                                    <p className="text-xs text-[var(--color-text-muted)]">AI Settings</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">Quick Settings</label>

                                {/* Upscale Factor */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">Upscale Factor</label>
                                    <div className="grid grid-cols-2 gap-2 bg-black/20 p-1.5 rounded-xl">
                                        {(['2x', '4x'] as const).map(factor => (
                                            <SettingsButton key={factor} onClick={() => updateSettings({ factor })} isActive={settings.factor === factor}>
                                                {factor}
                                            </SettingsButton>
                                        ))}
                                    </div>
                                </div>

                                {/* Enhancement Style */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">Enhancement Style</label>
                                    <div className="grid grid-cols-2 gap-2 bg-black/20 p-1.5 rounded-xl">
                                        {(['photorealistic', 'artistic'] as const).map(mode => (
                                            <SettingsButton key={mode} onClick={() => updateSettings({ mode })} isActive={settings.mode === mode} className="capitalize text-sm">
                                                {mode === 'photorealistic' ? 'Photorealistic' : 'Artistic'}
                                            </SettingsButton>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[var(--color-panel-border)]/30 pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <SparklesIcon className="h-5 w-5 text-[var(--color-primary-light)]" />
                                    <label className="text-sm font-semibold text-[var(--color-text)]">AI Enhancement</label>
                                </div>

                                {/* Detail Level */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">Detail Level</label>
                                    <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                                        {(['standard', 'enhanced', 'ultra'] as const).map(level => (
                                            <SettingsButton key={level} onClick={() => updateSettings({ detailLevel: level })} isActive={settings.detailLevel === level} className="capitalize text-xs px-2 py-2">
                                                {level}
                                            </SettingsButton>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Profile */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">Color Profile</label>
                                    <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                                        {(['natural', 'vibrant', 'dramatic'] as const).map(profile => (
                                            <SettingsButton key={profile} onClick={() => updateSettings({ colorProfile: profile })} isActive={settings.colorProfile === profile} className="capitalize text-xs px-2 py-2">
                                                {profile}
                                            </SettingsButton>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Toggle */}
                            <CollapsibleSection title="Advanced Settings" icon="⚙️" defaultOpen={false}>
                                <div className="space-y-4">
                                    {/* Texture Synthesis */}
                                    <div>
                                        <label className="group flex items-center justify-between text-sm font-medium text-[var(--color-text)] cursor-pointer" onClick={() => updateSettings({ textureSynthesis: !settings.textureSynthesis })}>
                                            <span>Texture Synthesis</span>
                                            <button
                                                type="button"
                                                className={`relative group inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 border border-black/10 shadow-inner shadow-black/20 overflow-hidden ${settings.textureSynthesis ? '' : 'bg-gray-700'}`}
                                                style={{ background: settings.textureSynthesis ? 'linear-gradient(to right, var(--color-primary-light), var(--color-primary))' : '' }}
                                                aria-label="Toggle Texture Synthesis"
                                            >
                                                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-full skew-x-[-15deg]"></span>
                                                <span className={`relative inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out shadow-md ${settings.textureSynthesis ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                            </button>
                                        </label>
                                    </div>

                                    {/* Content-Aware Processing */}
                                    <div>
                                        <label className="group flex items-center justify-between text-sm font-medium text-[var(--color-text)] cursor-pointer" onClick={() => updateSettings({ contentAwareProcessing: !settings.contentAwareProcessing })}>
                                            <span>Content-Aware Processing</span>
                                            <button
                                                type="button"
                                                className={`relative group inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 border border-black/10 shadow-inner shadow-black/20 overflow-hidden ${settings.contentAwareProcessing ? '' : 'bg-gray-700'}`}
                                                style={{ background: settings.contentAwareProcessing ? 'linear-gradient(to right, var(--color-primary-light), var(--color-primary))' : '' }}
                                                aria-label="Toggle Content Detection"
                                            >
                                                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-full skew-x-[-15deg]"></span>
                                                <span className={`relative inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out shadow-md ${settings.contentAwareProcessing ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                            </button>
                                        </label>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                            Automatically analyze image content to select the best enhancement model
                                        </p>
                                    </div>

                                    {/* Processing Strategy */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Processing Strategy</label>
                                        <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                                            {(['quality', 'balanced', 'fast'] as const).map(strategy => (
                                                <SettingsButton
                                                    key={strategy}
                                                    onClick={() => updateSettings({ qualityVsSpeed: strategy })}
                                                    isActive={settings.qualityVsSpeed === strategy}
                                                    className="capitalize text-xs px-2 py-2"
                                                >
                                                    {strategy}
                                                </SettingsButton>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Negative Prompt */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label htmlFor="negative-prompt" className="text-sm font-medium text-[var(--color-text)]">
                                                Negative Prompt
                                            </label>
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs"
                                                    aria-label="Negative prompt information"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-xs text-[var(--color-text-muted)]">
                                                    <p className="font-medium mb-1">Negative Prompt</p>
                                                    <p>Specify elements to avoid in your enhanced image.</p>
                                                    <p className="mt-2">Example: "blurry, noisy, jpeg artifacts"</p>
                                                </div>
                                            </div>
                                        </div>
                                        <textarea id="negative-prompt" rows={2}
                                            className="w-full bg-black/20 border border-[var(--color-panel-border)] rounded-lg p-2.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition resize-none"
                                            placeholder="e.g., blurry, noisy, jpeg artifacts"
                                            value={settings.negativePrompt}
                                            onChange={e => updateSettings({ negativePrompt: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Presets */}
                            <PresetSelector />

                            {/* Queue Status */}
                            <div className="border-t border-[var(--color-panel-border)]/30 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-[var(--color-text)]">Queue Status</span>
                                    <button
                                        className="px-3 py-1 text-xs rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                                        onClick={resetQueue}
                                        disabled={isProcessing}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <div className="text-lg font-bold text-[var(--color-text)]">{pendingCount}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Queued</div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <div className="text-lg font-bold text-[var(--color-text)]">{processingCount}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Processing</div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <div className="text-lg font-bold text-[var(--color-text)]">{images.filter(i => i.status === 'completed').length}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Completed</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};
