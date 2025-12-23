import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Particle System Component
 * Creates burst particle effects for game-like feedback
 */

const PARTICLE_PRESETS = {
    coins: { emoji: '💰', count: 12, spread: 80, gravity: 0.4, lifetime: 1200, size: 24 },
    sparkle: { emoji: '✨', count: 15, spread: 100, gravity: 0.1, lifetime: 800, size: 20 },
    boxes: { emoji: '📦', count: 6, spread: 50, gravity: 0.6, lifetime: 1000, size: 28 },
    smoke: { emoji: '💨', count: 8, spread: 40, gravity: -0.2, lifetime: 1000, size: 22 },
    confetti: { emoji: '🎉', count: 25, spread: 120, gravity: 0.3, lifetime: 1500, size: 26 },
    stars: { emoji: '⭐', count: 10, spread: 70, gravity: 0.2, lifetime: 900, size: 22 },
    hearts: { emoji: '❤️', count: 8, spread: 60, gravity: 0.25, lifetime: 1000, size: 20 },
    fire: { emoji: '🔥', count: 10, spread: 50, gravity: -0.15, lifetime: 800, size: 24 },
    money: { emoji: '💵', count: 15, spread: 90, gravity: 0.35, lifetime: 1100, size: 22 },
};

const CONFETTI_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Individual particle component
const Particle = ({ x, y, vx, vy, gravity, emoji, size, lifetime, delay }) => {
    const [pos, setPos] = useState({ x, y, opacity: 1, rotation: 0 });
    const frameRef = useRef();
    const startTime = useRef(Date.now() + delay);
    const velocityRef = useRef({ vx, vy });

    useEffect(() => {
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime.current;

            if (elapsed < 0) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            if (elapsed > lifetime) {
                setPos(prev => ({ ...prev, opacity: 0 }));
                return;
            }

            velocityRef.current.vy += gravity;

            setPos(prev => ({
                x: prev.x + velocityRef.current.vx,
                y: prev.y + velocityRef.current.vy,
                opacity: 1 - (elapsed / lifetime),
                rotation: prev.rotation + velocityRef.current.vx * 2
            }));

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [gravity, lifetime]);

    if (pos.opacity <= 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                fontSize: size,
                opacity: pos.opacity,
                transform: `rotate(${pos.rotation}deg) scale(${0.5 + pos.opacity * 0.5})`,
                pointerEvents: 'none',
                zIndex: 9999,
                transition: 'none',
            }}
        >
            {emoji}
        </div>
    );
};

// Confetti particle (colored squares/rectangles)
const ConfettiParticle = ({ x, y, vx, vy, gravity, color, lifetime, delay }) => {
    const [pos, setPos] = useState({ x, y, opacity: 1, rotation: 0 });
    const frameRef = useRef();
    const startTime = useRef(Date.now() + delay);
    const velocityRef = useRef({ vx, vy });
    const width = 8 + Math.random() * 8;
    const height = 4 + Math.random() * 4;

    useEffect(() => {
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime.current;

            if (elapsed < 0) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            if (elapsed > lifetime) {
                setPos(prev => ({ ...prev, opacity: 0 }));
                return;
            }

            velocityRef.current.vy += gravity;

            setPos(prev => ({
                x: prev.x + velocityRef.current.vx,
                y: prev.y + velocityRef.current.vy,
                opacity: 1 - (elapsed / lifetime) * 0.5,
                rotation: prev.rotation + velocityRef.current.vx * 5
            }));

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [gravity, lifetime]);

    if (pos.opacity <= 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width,
                height,
                backgroundColor: color,
                opacity: pos.opacity,
                transform: `rotate(${pos.rotation}deg)`,
                pointerEvents: 'none',
                zIndex: 9999,
                borderRadius: 2,
            }}
        />
    );
};

/**
 * ParticleBurst - triggers a burst of particles at a specific position
 */
export const ParticleBurst = ({ trigger, x, y, preset = 'sparkle', onComplete }) => {
    const [particles, setParticles] = useState([]);
    const config = PARTICLE_PRESETS[preset] || PARTICLE_PRESETS.sparkle;

    useEffect(() => {
        if (trigger) {
            const newParticles = [];

            for (let i = 0; i < config.count; i++) {
                const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5;
                const speed = config.spread * 0.05 * (0.5 + Math.random() * 0.5);

                newParticles.push({
                    id: `${Date.now()}-${i}`,
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2, // Initial upward velocity
                    emoji: config.emoji,
                    size: config.size,
                    gravity: config.gravity * 0.1,
                    lifetime: config.lifetime,
                    delay: i * 20 // Stagger particles slightly
                });
            }

            setParticles(newParticles);

            // Clean up after animation completes
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, config.lifetime + config.count * 20 + 100);

            return () => clearTimeout(timer);
        }
    }, [trigger]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 9999 }}>
            {particles.map(p => (
                <Particle key={p.id} {...p} />
            ))}
        </div>
    );
};

/**
 * ConfettiBurst - triggers a colorful confetti explosion
 */
export const ConfettiBurst = ({ trigger, x, y, onComplete }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (trigger) {
            const newParticles = [];
            const count = 40;

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
                const speed = 3 + Math.random() * 5;

                newParticles.push({
                    id: `${Date.now()}-${i}`,
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 4,
                    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                    gravity: 0.15,
                    lifetime: 2000,
                    delay: i * 10
                });
            }

            setParticles(newParticles);

            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [trigger]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 9999 }}>
            {particles.map(p => (
                <ConfettiParticle key={p.id} {...p} />
            ))}
        </div>
    );
};

/**
 * useParticles hook - provides a simple way to trigger particles
 */
export const useParticles = () => {
    const [bursts, setBursts] = useState([]);

    const emit = useCallback((x, y, preset = 'sparkle') => {
        const id = Date.now() + Math.random();
        setBursts(prev => [...prev, { id, x, y, preset }]);

        // Auto-cleanup after animation
        setTimeout(() => {
            setBursts(prev => prev.filter(b => b.id !== id));
        }, 2000);
    }, []);

    const ParticleContainer = useCallback(() => (
        <>
            {bursts.map(burst => (
                <ParticleBurst
                    key={burst.id}
                    trigger={true}
                    x={burst.x}
                    y={burst.y}
                    preset={burst.preset}
                />
            ))}
        </>
    ), [bursts]);

    return { emit, ParticleContainer };
};

export default { ParticleBurst, ConfettiBurst, useParticles, PARTICLE_PRESETS };
