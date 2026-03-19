import React from 'react';
import { motion } from 'framer-motion';

const LiquidBackground = ({ variant = "default" }) => {
    const isDark = variant === "dark";

    return (
        <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none bg-indigo-50/30">
            {/* Highly Saturated Liquid Blobs */}
            <motion.div 
                animate={{ 
                    x: [0, 200, 0], 
                    y: [0, -100, 0],
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className={`absolute -top-[10%] -left-[10%] w-[60%] h-[60%] ${isDark ? 'bg-indigo-900/40' : 'bg-[#4F46E5]/30'} blur-[140px] rounded-full mix-blend-multiply`} 
            />
            <motion.div 
                animate={{ 
                    x: [0, -200, 0], 
                    y: [0, 200, 0],
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className={`absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] ${isDark ? 'bg-purple-900/40' : 'bg-[#9333EA]/30'} blur-[140px] rounded-full mix-blend-multiply`} 
            />
            <motion.div 
                animate={{ 
                    x: [100, -100, 100], 
                    y: [-100, 100, -100],
                    scale: [1, 1.4, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`absolute top-1/3 left-1/4 w-[40%] h-[40%] ${isDark ? 'bg-pink-900/30' : 'bg-[#EC4899]/20'} blur-[140px] rounded-full mix-blend-multiply`} 
            />
            
            {/* High-fidelity Frosted Glass Overlay */}
            <div className={`absolute inset-0 backdrop-blur-[120px] ${isDark ? 'bg-black/60' : 'bg-white/40 border border-white/50 shadow-[inset_0_0_100px_rgba(255,255,255,0.5)]'}`} />
            
            {/* High-res Noise Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] brightness-[1.2] contrast-150 mix-blend-multiply" />
        </div>
    );
};

export default LiquidBackground;
