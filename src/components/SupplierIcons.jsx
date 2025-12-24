import React from 'react';

// Express/Rocket Supplier Icon - Fast delivery
export const RocketIcon = ({ size = 24, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2C12 2 8 6 8 12C8 14 8.5 15.5 9 17L7 19L8 22L10 20L12 22L14 20L16 22L17 19L15 17C15.5 15.5 16 14 16 12C16 6 12 2 12 2Z"
            fill="currentColor"
            opacity="0.9"
        />
        <circle cx="12" cy="10" r="2" fill="white" opacity="0.8" />
        <path
            d="M9 17L7 19M15 17L17 19"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M5 16L6.5 14.5M19 16L17.5 14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
        />
    </svg>
);

// Economy/Turtle Supplier Icon - Slow but affordable (simplified bold design)
export const TurtleIcon = ({ size = 24, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Shell - large dome shape */}
        <path
            d="M4 15C4 10 7 7 12 7C17 7 20 10 20 15C20 16 19 17 18 17H6C5 17 4 16 4 15Z"
            fill="currentColor"
        />
        {/* Shell pattern - hexagonal lines */}
        <path
            d="M12 7V17M8 9L8 16M16 9L16 16"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.4"
        />
        {/* Head */}
        <circle cx="21" cy="14" r="2.5" fill="currentColor" />
        <circle cx="22" cy="13" r="1" fill="white" opacity="0.9" />
        {/* Legs - thicker */}
        <rect x="6" y="16" width="3" height="4" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="15" y="16" width="3" height="4" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
);

// Premium/Crown Supplier Icon - High quality
export const CrownIcon = ({ size = 24, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3 18H21L19 8L15 12L12 6L9 12L5 8L3 18Z"
            fill="currentColor"
            opacity="0.9"
        />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        <circle cx="5" cy="8" r="1.5" fill="currentColor" />
        <circle cx="19" cy="8" r="1.5" fill="currentColor" />
        <rect x="3" y="18" width="18" height="2" rx="1" fill="currentColor" opacity="0.8" />
        {/* Gems */}
        <circle cx="8" cy="14" r="1" fill="white" opacity="0.6" />
        <circle cx="12" cy="13" r="1.2" fill="white" opacity="0.7" />
        <circle cx="16" cy="14" r="1" fill="white" opacity="0.6" />
    </svg>
);

// Wholesale/Boxes Supplier Icon - Bulk orders (simplified bold design)
export const BoxesIcon = ({ size = 24, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Main large box */}
        <rect x="2" y="10" width="14" height="12" rx="1.5" fill="currentColor" />
        {/* Box tape/cross */}
        <line x1="9" y1="10" x2="9" y2="22" stroke="white" strokeWidth="2" opacity="0.5" />
        <line x1="2" y1="15" x2="16" y2="15" stroke="white" strokeWidth="2" opacity="0.5" />

        {/* Stacked box on top right */}
        <rect x="12" y="3" width="10" height="9" rx="1.5" fill="currentColor" opacity="0.7" />
        <line x1="17" y1="3" x2="17" y2="12" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="12" y1="7" x2="22" y2="7" stroke="white" strokeWidth="1.5" opacity="0.4" />
    </svg>
);

export default {
    RocketIcon,
    TurtleIcon,
    CrownIcon,
    BoxesIcon
};
