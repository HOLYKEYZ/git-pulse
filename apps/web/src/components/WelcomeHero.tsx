"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, useInView } from "framer-motion";

// Configuration for GitHub strict colors
const COLORS = {
  bg: "#0D1117",
  canvas: "#161B22",
  border: "#30363D",
  green: "#238636",
  blue: "#1F6FEB",
  text: "#E6EDF3",
  muted: "#8B949E",
  glow: "rgba(35, 134, 54, 0.15)",
};

/* -------------------------------------------------------------------------- */
/*                                animations                                  */
/* -------------------------------------------------------------------------- */
const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: SPRING },
};

/* -------------------------------------------------------------------------- */
/*                            robot head (three.js)                           */
/* -------------------------------------------------------------------------- */

// module-level materials (shared, never re-created)
const darkMaterial = new THREE.MeshStandardMaterial({
  color: 0x161B22,
  roughness: 0.8,
  metalness: 0.2,
});
const borderMaterial = new THREE.MeshStandardMaterial({
  color: 0x30363D,
  roughness: 0.5,
  metalness: 0.5,
});
const visorMaterial = new THREE.MeshBasicMaterial({ color: '#010409' });
const eyeMaterialProps = {
  color: 0xffffff,
  emissive: 0x238636,
  emissiveIntensity: 3,
  toneMapped: false,
};

// module-level geometries (shared, never re-created — prevents memory leak at 60fps)
const headGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const headFrameGeometry = new THREE.BoxGeometry(1.55, 1.55, 1.45);
const antennaBaseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.2, 16);
const antennaStickGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
const antennaBulbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const visorGeometry = new THREE.PlaneGeometry(1.5, 0.8);
const eyeGeometry = new THREE.CircleGeometry(0.15, 32);
const earGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);

function RobotHead() {
  const groupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  const { mouse, viewport } = useThree();

useFrame((state) => {
  if (!groupRef.current) return;
  // Limit frame rate to 30 FPS for better performance
  if (state.clock.getElapsedTime() % (1 / 30) < (1 / 60)) return;
    if (!groupRef.current) return;

    // 1. Mouse tracking: map normalized mouse coordinate over head rotation
    const targetX = mouse.x * 0.4;
    const targetY = mouse.y * -0.2;

    // Smooth damp rotation
    groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.1;
    groupRef.current.rotation.x += (targetY - groupRef.current.rotation.x) * 0.1;

    // 2. Idle floating animation
    const time = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(time * 2) * 0.1;

    // 3. Move eyes slightly towards the mouse relative to the head
    const eyeMoveX = mouse.x * 0.15;
    const eyeMoveY = mouse.y * 0.1;
    
    if (leftEyeRef.current && rightEyeRef.current) {
        // Base positions X: -0.4 and +0.4, Y: 0.2
        leftEyeRef.current.position.x = -0.4 + eyeMoveX;
        leftEyeRef.current.position.y = 0.2 + eyeMoveY;
        
        rightEyeRef.current.position.x = 0.4 + eyeMoveX;
        rightEyeRef.current.position.y = 0.2 + eyeMoveY;
        
        // Blink animation
        const blinkCycle = time % 5;
        // Blink for a tiny fraction of a second every 5 seconds
        if (blinkCycle > 4.8 && blinkCycle < 4.9) {
            leftEyeRef.current.scale.y = 0.1;
            rightEyeRef.current.scale.y = 0.1;
        } else {
            // Restore scale smoothly
            leftEyeRef.current.scale.y += (1 - leftEyeRef.current.scale.y) * 0.3;
            rightEyeRef.current.scale.y += (1 - rightEyeRef.current.scale.y) * 0.3;
        }
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* main head box */}
      <mesh castShadow receiveShadow geometry={headGeometry} material={darkMaterial} />
      
      {/* head border outline/frame */}
      <mesh geometry={headFrameGeometry} material={borderMaterial} />
      
      {/* antenna base */}
      <mesh position={[0, 1.1, 0]} geometry={antennaBaseGeometry} material={borderMaterial} />
      {/* antenna stick */}
      <mesh position={[0, 1.4, 0]} geometry={antennaStickGeometry} material={darkMaterial} />
      {/* antenna bulb (glowing) */}
      <mesh position={[0, 1.75, 0]} geometry={antennaBulbGeometry}>
        <meshStandardMaterial {...eyeMaterialProps} />
      </mesh>

      {/* visor area (deeper dark) */}
      <mesh position={[0, 0.2, 1.01]} geometry={visorGeometry} material={visorMaterial} />

      {/* left eye */}
      <mesh ref={leftEyeRef} position={[-0.4, 0.2, 1.02]} geometry={eyeGeometry}>
        <meshStandardMaterial {...eyeMaterialProps} />
      </mesh>

      {/* right eye */}
      <mesh ref={rightEyeRef} position={[0.4, 0.2, 1.02]} geometry={eyeGeometry}>
        <meshStandardMaterial {...eyeMaterialProps} />
      </mesh>
      
      {/* ear pieces */}
      <mesh position={[-1.05, 0, 0]} geometry={earGeometry} rotation={[0, 0, Math.PI/2]} material={borderMaterial} />
      <mesh position={[1.05, 0, 0]} geometry={earGeometry} rotation={[0, 0, Math.PI/2]} material={borderMaterial} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ui components                               */
/* -------------------------------------------------------------------------- */

function Button({ children, href, variant = "primary" }: { children: React.ReactNode, href: string, variant?: "primary" | "ghost" }) {
    const isPrimary = variant === "primary";
    
    return (
        <a 
            href={href}
            className={`
                inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-[14px] font-semibold transition-all duration-200
                ${isPrimary 
                    ? `bg-[#238636] hover:bg-[#2ea043] text-white border border-[rgba(240,246,252,0.1)]` 
                    : `bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d]`
                }
            `}
        >
            {children}
        </a>
    )
}

function Typewriter({ phrases }: { phrases: string[] }) {
    const [index, setIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);
  
    useEffect(() => {
      const phrase = phrases[index];
      const speed = deleting ? 20 : 50;
      if (!deleting && charIndex === phrase.length) {
        const t = setTimeout(() => setDeleting(true), 2400);
        return () => clearTimeout(t);
      }
      if (deleting && charIndex === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
        return;
      }
      const t = setTimeout(() => setCharIndex((c) => c + (deleting ? -1 : 1)), speed);
      return () => clearTimeout(t);
    }, [charIndex, deleting, index, phrases]);
  
    return (
      <span className="font-mono text-[#238636]">
        {phrases[index].substring(0, charIndex)}
        <span className="animate-pulse opacity-70">█</span>
      </span>
    );
}

// Reusable scroll-reveal section
function RevealSection({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, duration: 0.8, delay: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/* -------------------------------------------------------------------------- */
/*                                mock ui cards                               */
/* -------------------------------------------------------------------------- */

function MockGitHubFeed() {
    return (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 w-full opacity-80 filter grayscale-[50%]">
            <h4 className="text-[12px] font-semibold text-[#8B949E] mb-3 uppercase tracking-wider">GitHub today</h4>
            <div className="space-y-4">
                {[
                    {text: "gaearon starred a repository", repo: "facebook/react", icon: "★"},
                    {text: "holykeyz followed linus", icon: "👤"},
                    {text: "leerob forked a repository", repo: "vercel/next.js", icon: "⎇"}
                ].map((item, i) => (
                    <div key={i} className="flex gap-3 text-[13px] border-b border-[#30363D] pb-3 last:border-0 last:pb-0">
                        <span className="text-[#8B949E]">{item.icon}</span>
                        <div>
                            <span className="text-[#8B949E]">{item.text}</span>
                            {item.repo && <span className="block font-bold text-[#C9D1D9]">{item.repo}</span>}
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#161B22] to-transparent rounded-b-lg"></div>
        </div>
    )
}

function MockGitPulseFeed() {
    return (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-0 w-full relative overflow-hidden shadow-[0_0_30px_rgba(35,134,54,0.1)]">
            <div className="p-3 border-b border-[#30363D] bg-[#0D1117]">
                <h4 className="text-[12px] font-semibold text-[#238636] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#238636] animate-pulse"></span>
                    GitPulse
                </h4>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#238636] to-[#2EA043]"></div>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-[#E6EDF3] text-[13px]">holykeyz</span>
                            <span className="text-[#8B949E] text-[12px]">2h</span>
                        </div>
                        <p className="text-[14px] text-[#C9D1D9] mb-2 leading-relaxed">
                            Just released the completely rewritten GitPulse landing page. Vibe coding with Three.js 🤖
                        </p>
                        <div className="inline-flex px-2 py-1 bg-[#1F6FEB]/10 border border-[#1F6FEB]/30 rounded text-[#1F6FEB] font-mono text-[11px] mb-3">
                            holykeyz/git-pulse
                        </div>
                        <div className="flex gap-4 text-[#8B949E] text-[12px]">
                            <span className="flex items-center gap-1 hover:text-[#238636] transition-colors">♡ 128</span>
                            <span className="flex items-center gap-1 hover:text-[#1F6FEB] transition-colors">💬 14</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MockGitPulseFeedFeature() {
    return (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-0 w-full relative overflow-hidden shadow-[0_0_30px_rgba(35,134,54,0.1)]">
            <div className="p-3 border-b border-[#30363D] bg-[#0D1117]">
                <h4 className="text-[12px] font-semibold text-[#238636] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#238636] animate-pulse"></span>
                    GitPulse
                </h4>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F6FEB] to-[#58A6FF]"></div>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-[#E6EDF3] text-[13px]">alex.dev</span>
                            <span className="text-[#8B949E] text-[12px]">12m</span>
                        </div>
                        <p className="text-[14px] text-[#C9D1D9] mb-2 leading-relaxed">
                            Finally nailed the memory leak issue in the WebGL renderer! 📉 The optimization guide is up in discussions. Make sure you are properly disposing your orphaned textures.
                        </p>
                        <div className="inline-flex px-2 py-1 bg-[#238636]/10 border border-[#238636]/30 rounded text-[#238636] font-mono text-[11px] mb-3">
                            alex/engine-core
                        </div>
                        <div className="flex gap-4 text-[#8B949E] text-[12px]">
                            <span className="flex items-center gap-1 hover:text-[#238636] transition-colors">♡ 342</span>
                            <span className="flex items-center gap-1 hover:text-[#1F6FEB] transition-colors">💬 45</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MockShip() {
    return (
        <div className="border-l-2 border-[#238636] pl-4 py-2">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🚀</span>
                <span className="px-2 py-0.5 rounded-full border border-[#238636]/30 bg-[#238636]/10 text-[#238636] font-mono text-[11px] font-bold">
                    v3.0.0
                </span>
            </div>
            <div className="bg-[#161B22] border border-[#30363D] rounded-md p-3">
                <h5 className="font-bold text-[#E6EDF3] text-[13px] mb-1">holykeyz/git-pulse</h5>
                <p className="text-[12px] text-[#8B949E]">Major architecture overhaul. New algo feed. 10x faster response times.</p>
            </div>
            <div className="flex gap-3 mt-3 text-[11px] text-[#8B949E] font-mono">
                <span>♡ 420 likes</span>
                <span>↓ 10.2k pulls</span>
            </div>
        </div>
    )
}

function MockAlgo() {
    return (
        <div className="space-y-3">
            {[
                {name: "aiko.py", lang: "Python", lcolor: "#3572A5", commits: 2191},
                {name: "chen.rs", lang: "Rust", lcolor: "#dea584", commits: 843},
            ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#161B22] border border-[#30363D] rounded-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#30363D]"></div>
                        <div>
                            <div className="text-[13px] font-bold text-[#E6EDF3]">{p.name}</div>
                            <div className="text-[11px] text-[#8B949E] font-mono">
                                <span style={{color: p.lcolor}}>● {p.lang}</span> · {p.commits} commits
                            </div>
                        </div>
                    </div>
                    <button className="px-3 py-1 bg-[#21262d] border border-[#30363D] text-[#c9d1d9] text-[12px] font-semibold rounded-md hover:bg-[#30363D] transition-colors">
                        Follow
                    </button>
                </div>
            ))}
        </div>
    )
}

function MockRealtime() {
    return (
        <div className="font-mono text-[11px] space-y-3 overflow-hidden h-[150px] relative">
            <div className="absolute top-0 w-full h-[50px] bg-gradient-to-b from-[#0D1117] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 w-full h-[50px] bg-gradient-to-t from-[#0D1117] to-transparent z-10 pointer-events-none" />
            
            {[
                { a: "pushed to main", r: "vercel/next.js", c: "#238636" },
                { a: "merged PR #412", r: "leonxlnx/taste-skill", c: "#1F6FEB" },
                { a: "starred", r: "tailwindlabs/tailwindcss", c: "#e3b341" },
            ].map((e, i) => (
                <div key={i} className="flex gap-3 py-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.c }}></span>
                    <span className="text-[#8B949E]">{e.a}</span>
                    <span className="text-[#C9D1D9] font-bold">{e.r}</span>
                </div>
            ))}
        </div>
    )
}


/* -------------------------------------------------------------------------- */
/*                                main components                              */
/* -------------------------------------------------------------------------- */

export default function WelcomeHero() {
    return (
        <div className="w-full bg-[#0D1117] text-[#E6EDF3] font-sans selection:bg-[#1F6FEB]/30 overflow-x-hidden">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-[#0D1117]/80 backdrop-blur-md border-b border-[#30363D] h-16 flex items-center justify-between px-4 md:px-6 lg:px-10">
                <div className="flex items-center gap-2 md:gap-3">
                    <svg height="24" viewBox="0 0 16 16" width="24" fill="currentColor">
                        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                    </svg>
                    <span className="font-semibold text-lg tracking-tight">GitPulse</span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/login" className="text-sm font-medium hover:text-[#1F6FEB] transition-colors">Sign in</a>
                    <Button href="/login" variant="primary">Sign up</Button>
                </div>
            </nav>

            {/* --- 1. HERO SECTION --- */}
            <section className="relative w-full min-h-[100dvh] pt-24 pb-12 md:pt-16 md:pb-0 flex items-center overflow-hidden border-b border-[#30363D]">
                {/* Background Layered Code/Glow */}
                <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-end mix-blend-screen overflow-hidden">
                    <div className="w-full max-w-[800px] h-[300px] md:h-[500px] bg-[#238636] rounded-t-full blur-[100px] md:blur-[150px] opacity-20 transform translate-y-1/2"></div>
                </div>
                
                <div className="max-w-[1280px] mx-auto w-full px-4 md:px-6 lg:px-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
                    <motion.div 
                        className="flex-1 max-w-xl"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={fadeUp} className="mb-6 inline-flex border border-[#238636]/30 bg-[#238636]/10 text-[#238636] px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#238636] animate-pulse"></span>
                            Now in Public Beta
                        </motion.div>
                        
                        <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.1] mb-4 md:mb-6">
                            The social layer <br />
                            <span className="text-[#8B949E]">for open source</span>
                        </motion.h1>
                        
                        <motion.p variants={fadeUp} className="text-[18px] text-[#8B949E] leading-relaxed mb-6">
                            GitHub has 100M developers and zero social feed. GitPulse fixes that ; follow builders, post updates, ship releases, and get discovered by algorithm even with 0 followers.
                        </motion.p>
                        
                        <motion.div variants={fadeUp} className="mb-10 text-[15px]">
                            <Typewriter phrases={["ship what matters", "get discovered", "build in public", "stay connected"]} />
                        </motion.div>
                        
                        <motion.div variants={fadeUp} className="flex gap-4">
                            <Button href="/login" variant="primary">
                                <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                                    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                                </svg>
                                <span className="hidden sm:inline">Get started with GitHub</span>
                                <span className="sm:hidden">Get started</span>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Right side: 3D Robot Head using Three.js */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="flex-1 w-full h-[400px] lg:h-[600px] order-first lg:order-last cursor-crosshair hidden md:block"
                    >
                        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1.5} />
                            <pointLight position={[-10, -10, -5]} intensity={0.5} />
                            <Suspense fallback={null}>
                                <RobotHead />
                            </Suspense>
                        </Canvas>
                    </motion.div>
                </div>
            </section>

            {/* --- 2. problem statement --- */}
            <RevealSection className="py-24 border-b border-[#30363D] max-w-[1000px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Your best work deserves to be seen.</h2>
                    <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
                        You push to GitHub every day. You build things people would love — but GitHub's feed only shows who starred what. No posts. No discovery. No algorithm working for you. Just silence.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 items-start overflow-hidden px-2">
                    <div className="w-full">
                        <MockGitHubFeed />
                        <p className="text-center text-[#8B949E] mt-4 text-sm">GitHub today: Just an activity log.</p>
                    </div>
                    <div>
                        <MockGitPulseFeed />
                        <p className="text-center text-[#238636] font-semibold mt-4 text-sm flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#238636]"></span>
                            GitPulse: A real social network.
                        </p>
                    </div>
                </div>
            </RevealSection>

            {/* --- 3. FEATURE SHOWCASE --- */}
            <section className="py-32 border-b border-[#30363D] max-w-[1100px] mx-auto px-6 overflow-hidden">
                <div className="space-y-40">
                    
                    {/* Feature 1 */}
                    <RevealSection className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-4">Post updates, tag repos, react, comment.</h3>
                            <p className="text-[#8B949E] leading-relaxed">
                                A real feed — not just logs. Discuss architecture, share code snippets, ask questions, and engage directly with developers building the open-source ecosystem.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-full">
                            <div className="p-6 bg-[#161B22] border border-[#238636]/20 rounded-xl shadow-[0_0_40px_rgba(35,134,54,0.15)] relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/10 to-transparent rounded-xl pointer-events-none"></div>
                                <MockGitPulseFeedFeature />
                            </div>
                        </div>
                    </RevealSection>

                    {/* Feature 2 */}
                    <RevealSection className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-4">Ship releases that get attention.</h3>
                            <p className="text-[#8B949E] leading-relaxed">
                                Announce releases to your followers. Ship It posts get algo-boosted to people working in your stack. Turn a version bump into a community event.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-full">
                            <div className="p-6 bg-[#161B22] border border-[#238636]/20 rounded-xl shadow-[0_0_40px_rgba(35,134,54,0.15)] relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/10 to-transparent rounded-xl pointer-events-none"></div>
                                <MockShip />
                            </div>
                        </div>
                    </RevealSection>

                    {/* Feature 3 */}
                    <RevealSection className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-4">Get discovered by the algorithm.</h3>
                            <p className="text-[#8B949E] leading-relaxed">
                                The algorithm finds developers working in your stack — TypeScript, Rust, Python — before you've followed them. Zero followers? Incredible code still gets you seen.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-full">
                            <div className="p-6 bg-[#161B22] border border-[#238636]/20 rounded-xl shadow-[0_0_40px_rgba(35,134,54,0.15)] relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/10 to-transparent rounded-xl pointer-events-none"></div>
                                <MockAlgo />
                            </div>
                        </div>
                    </RevealSection>

                    {/* Feature 4 */}
                    <RevealSection className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-4">See your network build in real time.</h3>
                            <p className="text-[#8B949E] leading-relaxed">
                                Every push, every PR, every star — streaming live. Stay on the pulse of what the smartest engineers are working on minute by minute.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-full">
                            <div className="p-6 bg-[#161B22] border border-[#238636]/20 rounded-xl shadow-[0_0_40px_rgba(35,134,54,0.15)] relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/10 to-transparent rounded-xl pointer-events-none"></div>
                                <MockRealtime />
                            </div>
                        </div>
                    </RevealSection>

                </div>
            </section>

            {/* --- 4. social proof / builder stuff --- */}
            <RevealSection className="py-40 border-b border-[#30363D] text-center px-6 bg-gradient-to-b from-[#161B22]/50 to-transparent">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10">Built because the problem is real.</h2>
                    
                    <blockquote className="text-xl md:text-2xl text-[#8B949E] leading-relaxed italic border-l-4 border-[#30363D] pl-8 text-left mb-8 mx-auto max-w-2xl bg-[#0D1117] p-8 rounded-tr-lg rounded-br-lg">
                        "i build on GitHub every day. good projects, real work. but the algorithm doesn't care: if you don't have followers on X/github, you're invisible. gitPulse is what i wished existed."
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#238636] to-[#1F6FEB]"></div>
                        <div className="text-left">
                            <div className="font-bold">HOLYKEYZ</div>
                            <div className="text-sm font-mono text-[#8B949E]">builder</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 font-mono border-t border-[#30363D] pt-12">
                        {[
                            {n: "100M+", l: "GitHub users"},
                            {n: "420M+", l: "Repos analyzed"},
                            {n: "10x", l: "reach factor"},
                            {n: "< 500ms", l: "feed latency"}
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-2xl md:text-3xl text-[#E6EDF3] font-bold mb-2">{stat.n}</div>
                                <div className="text-[#8B949E] text-xs uppercase tracking-wider">{stat.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </RevealSection>

            {/* --- 5. CTA FOOTER --- */}
            <RevealSection className="py-32 text-center px-6">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white drop-shadow-[0_0_30px_rgba(35,134,54,0.3)]">
                        Stop shipping <br /> into the void.
                    </h2>
                    <p className="text-[#8B949E] text-lg mb-10">
                        Join developers who are building in public on GitPulse. Uncover the algorithm that rewards actual code.
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        <Button href="/login" variant="primary">
                            <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
                                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                            </svg>
                            Sign in with GitHub — it's free
                        </Button>
                        <span className="text-[#8B949E] text-[11px] mt-2">Open source. MIT license. No ads.</span>
                    </div>
                </div>
            </RevealSection>
            
            {/* Simple bottom footer */}
            <footer className="border-t border-[#30363D] py-8 px-6 flex justify-between items-center text-[12px] text-[#8B949E] max-w-[1280px] mx-auto">
                <div className="flex items-center gap-2">
                    <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg>
                    GitPulse © 2026
                </div>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-[#E6EDF3] transition-colors">Privacy</a>
                    <a href="#" className="hover:text-[#E6EDF3] transition-colors">Terms</a>
                </div>
            </footer>
        </div>
    )
}
