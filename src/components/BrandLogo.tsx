import React from "react";
import { motion } from "motion/react";

export const BrandLogoBig: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* SVG Image containing exact vector replica of RevendaX brand identity with path drawings */}
      <motion.svg
        width="160"
        height="120"
        viewBox="0 0 200 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_25px_rgba(139,92,246,0.38)]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0.8 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
      >
        <defs>
          {/* Neon Purple Gradient for Letter X, arrow, and bar chart */}
          <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          
          {/* Subtle White to Silver Gradient for Letter R */}
          <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Core Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. THREE ASCENDING PURPLE BARS (Investment/Growth Indicator) with growth animation */}
        <motion.rect 
          x="76" y="76" width="6" height="20" rx="1.5" fill="url(#purpleGrad)"
          variants={{
            hidden: { scaleY: 0 },
            visible: { scaleY: 1 }
          }}
          style={{ originY: "96px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.rect 
          x="86" y="67" width="6" height="29" rx="1.5" fill="url(#purpleGrad)"
          variants={{
            hidden: { scaleY: 0 },
            visible: { scaleY: 1 }
          }}
          style={{ originY: "96px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.rect 
          x="96" y="58" width="6" height="38" rx="1.5" fill="url(#purpleGrad)"
          variants={{
            hidden: { scaleY: 0 },
            visible: { scaleY: 1 }
          }}
          style={{ originY: "96px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* 2. SWEEPING UPWARD GROWTH ARROW - flowing layout */}
        <motion.path
          d="M 64,95 C 80,95 110,91 138,55"
          stroke="url(#purpleGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1 }
          }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
        <motion.path
          d="M 138,55 L 130,55 L 137,63 Z"
          fill="url(#purpleGrad)"
          stroke="url(#purpleGrad)"
          strokeWidth="1"
          strokeLinejoin="round"
          variants={{
            hidden: { opacity: 0, scale: 0.3 },
            visible: { opacity: 1, scale: 1 }
          }}
          transition={{ duration: 0.4 }}
        />

        {/* 3. LETTER X (Intertwined on right) - elegant draw-in animation */}
        <motion.path
          d="M 112,41 L 148,81 M 148,41 L 112,81"
          stroke="url(#purpleGrad)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1 }
          }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />

        {/* 4. LETTER R (Overlapping on left, bold sleek line) - draw-in animation */}
        <motion.path
          d="M 67,78 C 67,41 120,41 120,58 C 120,78 67,70 120,83"
          stroke="url(#whiteGrad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1 }
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </motion.svg>

      {/* REVENDAX LOGOTYPE with spring fade entrance */}
      <motion.h1 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
        className="font-display font-black text-3.5xl tracking-tight text-white mt-1 mb-1 leading-none flex items-center justify-center"
      >
        <span>Revenda</span>
        <span className="text-purple-400 font-black uppercase text-[1.4em] ml-1 drop-shadow-[0_0_12px_rgba(139,92,246,0.85)] animate-pulse">X</span>
      </motion.h1>

      {/* TRACKED SLOGAN with elegant horizontal expansion */}
      <motion.div 
        initial={{ opacity: 0, width: "70%" }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
        className="flex items-center gap-2.5 w-full max-w-xs mt-1.5 justify-center"
      >
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-500/30"></div>
        <span className="text-[9.5px] text-purple-400 font-extrabold font-sans uppercase tracking-[0.25em] whitespace-nowrap leading-none">
          Controle total das suas vendas
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-500/30"></div>
      </motion.div>
    </div>
  );
};

export const BrandLogoCompact: React.FC<{ className?: string; size?: "sm" | "md" }> = ({ 
  className = "", 
  size = "md" 
}) => {
  const isSm = size === "sm";
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Sleek inline micro-symbol of the RX Brand */}
      <div className={`${isSm ? "w-7 h-7" : "w-8.5 h-8.5"} rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-650/30 border border-purple-500/25 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.15)]`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[80%] h-[80%]"
        >
          <defs>
            <linearGradient id="miniPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="miniWhite" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          {/* Inline miniature representation */}
          <path d="M55,20 L80,68 M80,20 L55,68" stroke="url(#miniPurple)" strokeWidth="14" strokeLinecap="round" />
          <path d="M22,65 C22,25 65,25 65,39 C65,59 22,51 65,65" stroke="url(#miniWhite)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="font-display font-black text-sm tracking-tight text-white uppercase flex items-center">
        <span>Revenda</span>
        <span className="text-purple-400 font-black uppercase text-[1.45em] ml-1 drop-shadow-[0_0_8px_rgba(139,92,246,0.65)] inline-block">X</span>
        <span className="text-[8px] text-purple-500/80 font-extrabold self-start mt-[-2px] ml-0.5">™</span>
      </span>
    </div>
  );
};
