import React from 'react';

interface RangeSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
    helpText?: string;
    className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    formatValue,
    helpText,
    className = ''
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
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
            {helpText && (
                <p className="text-xs text-[var(--color-text-muted)] opacity-70">{helpText}</p>
            )}
        </div>
    );
};