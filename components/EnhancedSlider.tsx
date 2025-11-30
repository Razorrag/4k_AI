import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface EnhancedSliderProps {
    originalImage: string;
    enhancedImage: string;
    initialPosition?: number;
    onPositionChange?: (position: number) => void;
    className?: string;
}

export const EnhancedSlider: React.FC<EnhancedSliderProps> = ({
    originalImage,
    enhancedImage,
    initialPosition = 50,
    onPositionChange,
    className = ''
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        setPosition(percentage);
        onPositionChange?.(percentage);
    }, [isDragging, onPositionChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        setPosition(percentage);
        onPositionChange?.(percentage);
    }, [isDragging, onPositionChange]);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden ${className}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Original Image (Background) */}
            <img
                src={originalImage}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
            />
            
            {/* Enhanced Image (Foreground with clipping) */}
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
                <img
                    src={enhancedImage}
                    alt="Enhanced"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                />
            </div>
            
            {/* Slider Line */}
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: `calc(${position}% - 2px)` }}
            >
                {/* Slider Handle */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-white shadow-2xl flex items-center justify-center"
                    style={{ 
                        background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-6 h-6 text-white rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </motion.div>
            </div>
            
            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm">
                Original
            </div>
            <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm">
                Enhanced
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm">
                Drag to compare
            </div>
        </div>
    );
};