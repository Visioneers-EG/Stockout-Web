import { useState, useEffect, useCallback } from 'react';

// Import all assets that need to be pre-cached
import bgMusic from '../assets/bg_music.mp3';
import pharmacyScene from '../assets/pharmacy_scene.jpg';
import pharmacyScenePng from '../assets/pharmacy_scene.png';
import customers from '../assets/customers.png';
import pharmacyBg from '../assets/pharmacy_bg.png';
import pharmacist from '../assets/pharmacist.png';
import pill from '../assets/pill.png';

// Asset manifest with metadata
const ASSETS = [
    // High priority - largest files
    { url: pharmacyScene, type: 'image', name: 'Pharmacy Scene', size: 3312766 },
    { url: bgMusic, type: 'audio', name: 'Background Music', size: 2264618 },

    // Medium priority - supporting images
    { url: pharmacyScenePng, type: 'image', name: 'Scene Overlay', size: 690088 },
    { url: customers, type: 'image', name: 'Customers', size: 613821 },
    { url: pharmacyBg, type: 'image', name: 'Background', size: 571313 },
    { url: pharmacist, type: 'image', name: 'Pharmacist', size: 537593 },
    { url: pill, type: 'image', name: 'Pill Icon', size: 3984 },
];

// Calculate total size for progress tracking
const TOTAL_SIZE = ASSETS.reduce((sum, asset) => sum + asset.size, 0);

/**
 * Pre-load an image and track progress
 */
const preloadImage = (url, onProgress) => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            onProgress(100);
            resolve(url);
        };

        img.onerror = () => {
            console.warn(`Failed to load image: ${url}`);
            onProgress(100); // Continue anyway
            resolve(url);
        };

        // Track loading progress via XHR for images
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const blob = xhr.response;
                img.src = URL.createObjectURL(blob);
            } else {
                img.src = url; // Fallback
            }
        };

        xhr.onerror = () => {
            img.src = url; // Fallback to direct load
        };

        xhr.send();
    });
};

/**
 * Pre-load audio and track progress
 */
const preloadAudio = (url, onProgress) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                // Create audio element to ensure browser caches it
                const audio = new Audio();
                audio.preload = 'auto';
                audio.src = URL.createObjectURL(xhr.response);
                onProgress(100);
                resolve(url);
            } else {
                console.warn(`Failed to load audio: ${url}`);
                onProgress(100);
                resolve(url);
            }
        };

        xhr.onerror = () => {
            console.warn(`Failed to load audio: ${url}`);
            onProgress(100);
            resolve(url);
        };

        xhr.send();
    });
};

/**
 * Custom hook for pre-loading game assets
 * Returns loading state, progress, and current asset being loaded
 */
export function useAssetPreloader() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentAsset, setCurrentAsset] = useState('Initializing...');
    const [loadedBytes, setLoadedBytes] = useState(0);

    useEffect(() => {
        let isMounted = true;
        let totalLoaded = 0;

        const loadAssets = async () => {
            const assetProgress = new Map();

            // Initialize progress for each asset
            ASSETS.forEach(asset => {
                assetProgress.set(asset.url, 0);
            });

            const updateTotalProgress = () => {
                if (!isMounted) return;

                let loaded = 0;
                ASSETS.forEach(asset => {
                    const assetPercent = assetProgress.get(asset.url) || 0;
                    loaded += (asset.size * assetPercent) / 100;
                });

                const overallProgress = Math.min(100, (loaded / TOTAL_SIZE) * 100);
                setProgress(Math.round(overallProgress));
                setLoadedBytes(Math.round(loaded));
            };

            // Load assets sequentially for better UX feedback
            for (const asset of ASSETS) {
                if (!isMounted) break;

                setCurrentAsset(asset.name);

                const onProgress = (percent) => {
                    assetProgress.set(asset.url, percent);
                    updateTotalProgress();
                };

                try {
                    if (asset.type === 'image') {
                        await preloadImage(asset.url, onProgress);
                    } else if (asset.type === 'audio') {
                        await preloadAudio(asset.url, onProgress);
                    }
                } catch (err) {
                    console.warn(`Error loading ${asset.name}:`, err);
                    assetProgress.set(asset.url, 100); // Skip failed assets
                }
            }

            if (isMounted) {
                setProgress(100);
                setCurrentAsset('Ready!');

                // Small delay before completing to ensure smooth transition
                setTimeout(() => {
                    if (isMounted) {
                        setIsLoading(false);
                    }
                }, 500);
            }
        };

        loadAssets();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        isLoading,
        progress,
        currentAsset,
        loadedBytes,
        totalBytes: TOTAL_SIZE
    };
}

export default useAssetPreloader;
