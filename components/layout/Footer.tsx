import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '../Icons';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="glass-panel-pro border-t border-[var(--color-panel-border-strong)] mt-auto">
            <div className="px-6 lg:px-8 py-8">
                {/* Main Footer Content */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
                    {/* Brand Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/25">
                            <SparklesIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--color-text)]">Flurry AI</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">Professional Image Enhancement</p>
                        </div>
                    </motion.div>

                    {/* Links Section */}
                    <motion.nav
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex items-center gap-8 text-sm"
                    >
                        <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors font-medium">
                            Documentation
                        </a>
                        <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors font-medium">
                            API
                        </a>
                        <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors font-medium">
                            Support
                        </a>
                        <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors font-medium">
                            Privacy
                        </a>
                    </motion.nav>

                    {/* Copyright Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-sm text-[var(--color-text-secondary)]"
                    >
                        © {currentYear} Flurry AI. All rights reserved.
                    </motion.div>
                </div>

                {/* Status and Info Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="py-6 border-t border-[var(--color-panel-border)]/30 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></div>
                        <span className="font-medium">System Status: Operational</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                        <span className="px-2 py-1 bg-[var(--color-glass-bg)] rounded-md">Version 2.0.1</span>
                        <span className="text-[var(--color-text-muted)]">•</span>
                        <span>Powered by Advanced AI</span>
                    </div>
                </motion.div>
                
                {/* Legal and Disclosure */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="pt-6 border-t border-[var(--color-panel-border)]/30 text-sm text-center text-[var(--color-text-muted)]"
                >
                    <div className="flex items-center justify-center gap-4">
                        <a href="/privacy" className="text-[var(--color-primary-light)] hover:underline font-medium">Privacy Policy</a>
                        <span className="text-[var(--color-text-muted)]">•</span>
                        <a href="/terms" className="text-[var(--color-primary-light)] hover:underline font-medium">Terms of Service</a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};