/**
 * Sound Effects Hook for STOCKOUT Game
 * 
 * Generates synthesized sounds using the Web Audio API.
 * All sounds are designed to match the pharmacy/arcade game theme.
 */

import { useCallback, useEffect, useRef } from 'react';

// Audio context singleton
let audioContext = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
};

// Sound generation functions
const createOscillator = (ctx, type, frequency, duration, gain = 0.3) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
};

// === SOUND DEFINITIONS ===
// Pharmacy-themed, warm arcade sounds

// Soft click - for UI interactions
const playClick = (ctx) => {
    createOscillator(ctx, 'sine', 800, 0.08, 0.15);
    setTimeout(() => createOscillator(ctx, 'sine', 600, 0.05, 0.1), 30);
};

// Order increase - cheerful ascending tone
const playOrderPlus = (ctx) => {
    createOscillator(ctx, 'sine', 523, 0.08, 0.2); // C5
    setTimeout(() => createOscillator(ctx, 'sine', 659, 0.08, 0.2), 50); // E5
    setTimeout(() => createOscillator(ctx, 'sine', 784, 0.1, 0.15), 100); // G5
};

// Order decrease - gentle descending tone
const playOrderMinus = (ctx) => {
    createOscillator(ctx, 'triangle', 523, 0.08, 0.15); // C5
    setTimeout(() => createOscillator(ctx, 'triangle', 440, 0.1, 0.12), 60); // A4
};

// Confirm order - satisfying chime (cash register sound)
const playConfirm = (ctx) => {
    createOscillator(ctx, 'sine', 880, 0.1, 0.25); // A5
    setTimeout(() => createOscillator(ctx, 'sine', 1109, 0.1, 0.25), 80); // C#6
    setTimeout(() => createOscillator(ctx, 'sine', 1319, 0.15, 0.2), 160); // E6
    setTimeout(() => createOscillator(ctx, 'sine', 1760, 0.2, 0.15), 250); // A6
};

// Stock arrival - truck/delivery sound (low rumble + ding)
const playArrival = (ctx) => {
    // Low rumble
    const noise = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noise.type = 'triangle';
    noise.frequency.setValueAtTime(80, ctx.currentTime);
    noise.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.3);
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.4);

    // Arrival ding
    setTimeout(() => {
        createOscillator(ctx, 'sine', 1047, 0.15, 0.2); // C6
        setTimeout(() => createOscillator(ctx, 'sine', 1319, 0.2, 0.25), 100); // E6
    }, 300);
};

// Customer demand reveal - attention-grabbing bell
const playDemand = (ctx) => {
    createOscillator(ctx, 'sine', 1175, 0.12, 0.2); // D6
    setTimeout(() => createOscillator(ctx, 'sine', 988, 0.12, 0.18), 100); // B5
    setTimeout(() => createOscillator(ctx, 'sine', 1175, 0.15, 0.15), 200); // D6
};

// Successful sale - cheerful ka-ching!
const playSale = (ctx) => {
    createOscillator(ctx, 'sine', 1047, 0.06, 0.2); // C6
    setTimeout(() => createOscillator(ctx, 'sine', 1319, 0.06, 0.2), 40); // E6
    setTimeout(() => createOscillator(ctx, 'sine', 1568, 0.08, 0.25), 80); // G6
    setTimeout(() => createOscillator(ctx, 'sine', 2093, 0.12, 0.2), 130); // C7
};

// Missed sale - disappointed low tone
const playMiss = (ctx) => {
    createOscillator(ctx, 'triangle', 392, 0.15, 0.2); // G4
    setTimeout(() => createOscillator(ctx, 'triangle', 330, 0.15, 0.18), 120); // E4
    setTimeout(() => createOscillator(ctx, 'triangle', 294, 0.25, 0.15), 250); // D4
};

// Spoilage - sad descending warning
const playSpoil = (ctx) => {
    createOscillator(ctx, 'sawtooth', 440, 0.15, 0.1); // A4
    setTimeout(() => createOscillator(ctx, 'sawtooth', 370, 0.15, 0.08), 130); // F#4
    setTimeout(() => createOscillator(ctx, 'sawtooth', 294, 0.2, 0.06), 260); // D4
};

// Victory fanfare - triumphant
const playVictory = (ctx) => {
    const notes = [
        { freq: 523, delay: 0 },      // C5
        { freq: 659, delay: 100 },    // E5
        { freq: 784, delay: 200 },    // G5
        { freq: 1047, delay: 350 },   // C6
        { freq: 784, delay: 450 },    // G5
        { freq: 1047, delay: 550 },   // C6
        { freq: 1319, delay: 700 },   // E6
    ];

    notes.forEach(({ freq, delay }) => {
        setTimeout(() => createOscillator(ctx, 'sine', freq, 0.2, 0.2), delay);
    });
};

// Defeat sound - somber
const playDefeat = (ctx) => {
    const notes = [
        { freq: 392, delay: 0 },    // G4
        { freq: 349, delay: 200 },  // F4
        { freq: 330, delay: 400 },  // E4
        { freq: 262, delay: 650 },  // C4
    ];

    notes.forEach(({ freq, delay }) => {
        setTimeout(() => createOscillator(ctx, 'triangle', freq, 0.3, 0.15), delay);
    });
};

// Tutorial step transition - gentle whoosh
const playNextStep = (ctx) => {
    createOscillator(ctx, 'sine', 440, 0.08, 0.12);
    setTimeout(() => createOscillator(ctx, 'sine', 554, 0.08, 0.12), 50);
    setTimeout(() => createOscillator(ctx, 'sine', 659, 0.1, 0.1), 100);
};

// === HOOK ===
const useSoundEffects = () => {
    const isMutedRef = useRef(false);
    const isInitializedRef = useRef(false);

    // Initialize audio context on first user interaction
    const initAudio = useCallback(() => {
        if (!isInitializedRef.current) {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            isInitializedRef.current = true;
        }
    }, []);

    // Generic play function wrapper
    const play = useCallback((soundFn) => {
        if (isMutedRef.current) return;

        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => soundFn(ctx));
            } else {
                soundFn(ctx);
            }
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }, []);

    // Sound effect methods
    const sounds = {
        click: useCallback(() => play(playClick), [play]),
        orderPlus: useCallback(() => play(playOrderPlus), [play]),
        orderMinus: useCallback(() => play(playOrderMinus), [play]),
        confirm: useCallback(() => play(playConfirm), [play]),
        arrival: useCallback(() => play(playArrival), [play]),
        demand: useCallback(() => play(playDemand), [play]),
        sale: useCallback(() => play(playSale), [play]),
        miss: useCallback(() => play(playMiss), [play]),
        spoil: useCallback(() => play(playSpoil), [play]),
        victory: useCallback(() => play(playVictory), [play]),
        defeat: useCallback(() => play(playDefeat), [play]),
        nextStep: useCallback(() => play(playNextStep), [play]),
    };

    // Mute toggle
    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        return isMutedRef.current;
    }, []);

    const setMuted = useCallback((muted) => {
        isMutedRef.current = muted;
    }, []);

    const isMuted = useCallback(() => isMutedRef.current, []);

    return {
        ...sounds,
        initAudio,
        toggleMute,
        setMuted,
        isMuted,
    };
};

export default useSoundEffects;
