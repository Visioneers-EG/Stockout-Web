import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import bgMusic from '../assets/bg_music.mp3';

// Context for music state
const MusicContext = createContext();

export const useMusicContext = () => useContext(MusicContext);

// Music Provider wraps the app
export function MusicProvider({ children }) {
    const [isMuted, setIsMuted] = useState(() => {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('stockout_music_muted');
        return saved === 'true';
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const audioRef = useRef(null);

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio(bgMusic);
        audio.loop = true;
        audio.volume = 0.3; // Start at 30% volume
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    // Try to start playing when user has interacted and not muted
    const tryPlay = useCallback(() => {
        if (audioRef.current && !isMuted && !isPlaying) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.log('Playback failed:', err);
            });
        }
    }, [isMuted, isPlaying]);

    // Listen for first user interaction to start music
    useEffect(() => {
        if (hasInteracted && !isMuted) {
            tryPlay();
        }
    }, [hasInteracted, isMuted, tryPlay]);

    // Set up interaction listeners
    useEffect(() => {
        const handleInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
            }
        };

        // Listen for various user interactions
        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('keydown', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
    }, [hasInteracted]);

    // Handle mute state changes
    useEffect(() => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else if (hasInteracted) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(err => {
                    console.log('Playback failed:', err);
                });
            }
        }
        localStorage.setItem('stockout_music_muted', isMuted.toString());
    }, [isMuted, hasInteracted]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
        // Also mark as interacted when user clicks the button
        if (!hasInteracted) {
            setHasInteracted(true);
        }
    }, [hasInteracted]);

    return (
        <MusicContext.Provider value={{ isMuted, isPlaying, toggleMute }}>
            {children}
        </MusicContext.Provider>
    );
}

// Floating button component to control music
export function MusicToggleButton() {
    const { isMuted, isPlaying, toggleMute } = useMusicContext();
    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: isHovered
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHovered
            ? '0 6px 20px rgba(99, 102, 241, 0.5)'
            : '0 4px 15px rgba(79, 70, 229, 0.4)',
        transition: 'all 0.3s ease',
        zIndex: 9999,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    };

    // Music on icon (speaker with waves)
    const MusicOnIcon = () => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
    );

    // Music off icon (speaker with X)
    const MusicOffIcon = () => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
    );

    return (
        <button
            onClick={toggleMute}
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={isMuted ? 'Unmute Music' : 'Mute Music'}
            aria-label={isMuted ? 'Unmute Music' : 'Mute Music'}
        >
            {isMuted ? <MusicOffIcon /> : <MusicOnIcon />}
        </button>
    );
}

export default MusicProvider;
