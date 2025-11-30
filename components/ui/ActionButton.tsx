import React, { ChangeEvent } from 'react';
import { motion } from 'framer-motion';

interface ActionButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
    isFileInput?: boolean;
    onFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
    onClick, 
    disabled, 
    children, 
    variant = 'primary', 
    className = '', 
    isFileInput = false, 
    onFileChange 
}) => {
    
    const baseClasses = "relative group flex items-center justify-center gap-3 px-6 py-3 text-base font-bold rounded-xl transition-all will-change-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] overflow-hidden shadow-lg";
    const disabledClasses = "disabled:cursor-not-allowed disabled:saturate-50 disabled:shadow-none disabled:opacity-60 disabled:filter-none";

    const variantClasses = {
        primary: "primary-button focus:ring-[var(--color-primary)]",
        secondary: "text-[var(--color-text)] glass-panel-subtle hover:bg-white/20 border border-[var(--color-panel-border)] active:scale-[0.98] focus:ring-[var(--color-primary)]",
        danger: "text-white bg-[var(--color-danger)]/80 hover:bg-[var(--color-danger)] border border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
    };
    
    const buttonContent = (
        <>
            {variant === 'primary' && <span className="shine"></span>}
            <span className="relative z-10 flex items-center justify-center gap-3">{children}</span>
        </>
    );
    
    const motionProps = {
        whileHover: { scale: 1.03 },
        whileTap: { scale: 0.97 },
        // FIX: Add 'as const' to ensure TypeScript infers a literal type for 'spring', satisfying framer-motion's Transition type.
        transition: { type: 'spring' as const, stiffness: 400, damping: 15 }
    };

    if (isFileInput) {
        return (
            <motion.label 
                {...motionProps}
                className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : 'cursor-pointer'} ${className}`}
            >
                <input type="file" multiple onChange={onFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={disabled} />
                {buttonContent}
            </motion.label>
        );
    }

    return (
        <motion.button
            {...motionProps}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
        >
            {buttonContent}
        </motion.button>
    );
}