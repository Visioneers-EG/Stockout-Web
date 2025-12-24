import React, { useState, useEffect } from 'react';
import { Pill, Package, TrendingUp, Sparkles } from 'lucide-react';
import { useAssetPreloader } from '../hooks/useAssetPreloader';

// Floating pill component for background animation
const FloatingPill = ({ delay, duration, left, size }) => {
    return (
        <div
            className="absolute animate-float-pill opacity-20"
            style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                bottom: '-50px',
            }}
        >
            <Pill
                size={size}
                className="text-emerald-400"
            />
        </div>
    );
};

// Progress ring component
const ProgressRing = ({ progress }) => {
    const radius = 80;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                {/* Background ring */}
                <circle
                    stroke="rgba(100, 116, 139, 0.3)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {/* Progress ring */}
                <circle
                    stroke="url(#progressGradient)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{
                        strokeDashoffset,
                        transition: 'stroke-dashoffset 0.3s ease-out'
                    }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="animate-progress-glow"
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Center content */}
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-white">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
};

// Main loading screen component
export function LoadingScreen({ onComplete }) {
    const { isLoading, progress, currentAsset } = useAssetPreloader();
    const [isExiting, setIsExiting] = useState(false);

    // Handle completion
    useEffect(() => {
        if (!isLoading && !isExiting) {
            setIsExiting(true);
            // Delay to allow exit animation
            setTimeout(() => {
                onComplete?.();
            }, 600);
        }
    }, [isLoading, isExiting, onComplete]);

    // Generate floating pills - slower and more evenly spaced
    const floatingPills = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        delay: i * 1.5,  // More staggered delays
        duration: 10 + i * 0.5,  // Slower, more consistent duration (10-12.5s)
        left: 8 + (i * 15),  // Evenly spaced across screen
        size: 24 + (i % 3) * 6  // Consistent sizes: 24, 30, 36
    }));

    return (
        <div
            className={`
                fixed inset-0 z-50 
                bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 
                flex flex-col items-center justify-center
                transition-opacity duration-500
                ${isExiting ? 'opacity-0' : 'opacity-100'}
            `}
        >
            {/* Background decorations */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

            {/* Floating pills */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {floatingPills.map(pill => (
                    <FloatingPill key={pill.id} {...pill} />
                ))}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                {/* Animated logo */}
                <div className="mb-8 animate-loading-pulse">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400">
                        STOCKOUT
                    </h1>
                    <div className="text-xs sm:text-sm text-slate-500 font-mono tracking-widest mt-2">
                        SUPPLY CHAIN COMMANDER
                    </div>
                </div>

                {/* Progress ring */}
                <div className="mb-8">
                    <ProgressRing progress={progress} />
                </div>

                {/* Loading info */}
                <div className="space-y-3">
                    {/* Loading bar */}
                    <div className="w-64 sm:w-80 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Current asset */}
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <Package size={14} className="animate-pulse" />
                        <span>{currentAsset}</span>
                    </div>

                    {/* Loading tip */}
                    <div className="mt-6 text-slate-600 text-xs flex items-center gap-2">
                        <Sparkles size={12} className="text-yellow-500" />
                        <span>Preparing your pharmacy...</span>
                        <Sparkles size={12} className="text-yellow-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoadingScreen;
