import React from 'react';

const LiquidBackground = ({ variant = "default" }) => {
    const isDark = variant === "dark";

    return (
        <div
            className="fixed inset-0 overflow-hidden z-0 pointer-events-none"
            style={{ background: isDark ? '#0f0c1a' : '#f5f3ff' }}
        >
            {/* Blob 1 — CSS animated, GPU-composited, no JS */}
            <div
                className="absolute rounded-full will-change-transform"
                style={{
                    top: '-10%', left: '-10%',
                    width: '60%', height: '60%',
                    background: isDark ? 'rgba(79,70,229,0.35)' : 'rgba(79,70,229,0.22)',
                    filter: 'blur(100px)',
                    animation: 'blob1 28s ease-in-out infinite alternate',
                }}
            />
            {/* Blob 2 */}
            <div
                className="absolute rounded-full will-change-transform"
                style={{
                    bottom: '5%', right: '-10%',
                    width: '55%', height: '55%',
                    background: isDark ? 'rgba(147,51,234,0.35)' : 'rgba(147,51,234,0.20)',
                    filter: 'blur(100px)',
                    animation: 'blob2 34s ease-in-out infinite alternate',
                }}
            />
            {/* Blob 3 */}
            <div
                className="absolute rounded-full will-change-transform"
                style={{
                    top: '30%', left: '20%',
                    width: '45%', height: '45%',
                    background: isDark ? 'rgba(236,72,153,0.20)' : 'rgba(236,72,153,0.13)',
                    filter: 'blur(90px)',
                    animation: 'blob3 22s ease-in-out infinite alternate',
                }}
            />

            {/* Frosted overlay */}
            <div
                className="absolute inset-0"
                style={{
                    backdropFilter: 'blur(80px)',
                    WebkitBackdropFilter: 'blur(80px)',
                    background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)',
                }}
            />

            {/* CSS Keyframes injected inline */}
            <style>{`
                @keyframes blob1 {
                    0%   { transform: translate(0, 0) scale(1); }
                    50%  { transform: translate(15%, -8%) scale(1.15); }
                    100% { transform: translate(5%, 10%) scale(0.95); }
                }
                @keyframes blob2 {
                    0%   { transform: translate(0, 0) scale(1); }
                    50%  { transform: translate(-12%, 10%) scale(1.2); }
                    100% { transform: translate(8%, -5%) scale(0.9); }
                }
                @keyframes blob3 {
                    0%   { transform: translate(0, 0) scale(1); }
                    50%  { transform: translate(10%, -12%) scale(1.1); }
                    100% { transform: translate(-8%, 8%) scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default LiquidBackground;
