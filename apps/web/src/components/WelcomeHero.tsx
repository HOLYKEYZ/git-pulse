"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";

// ── copilot head component that tracks cursor ──
function CopilotHead() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 80, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      // clamp rotation to a natural range
      const maxTilt = 25;
      const rx = Math.max(-maxTilt, Math.min(maxTilt, -(dy / 15)));
      const ry = Math.max(-maxTilt, Math.min(maxTilt, dx / 15));
      rotateX.set(rx);
      rotateY.set(ry);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX: springX,
        rotateY: springY,
        perspective: 600,
      }}
      className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44"
    >
      {/* copilot visor glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#58a6ff]/30 via-[#6e40c9]/20 to-transparent blur-2xl" />
      {/* the head */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_30px_rgba(88,166,255,0.4)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* helmet shell */}
        <ellipse cx="50" cy="48" rx="38" ry="42" fill="#1b1f23" stroke="#30363d" strokeWidth="1.5" />
        {/* visor */}
        <ellipse cx="50" cy="44" rx="28" ry="24" fill="url(#visorGrad)" opacity="0.95" />
        {/* visor reflection */}
        <ellipse cx="42" cy="38" rx="10" ry="6" fill="white" opacity="0.12" />
        {/* ear pieces */}
        <rect x="10" y="40" width="6" height="14" rx="3" fill="#21262d" stroke="#30363d" strokeWidth="1" />
        <rect x="84" y="40" width="6" height="14" rx="3" fill="#21262d" stroke="#30363d" strokeWidth="1" />
        {/* antenna */}
        <line x1="50" y1="6" x2="50" y2="14" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="50" cy="5" r="2.5" fill="#58a6ff" />
        {/* eyes */}
        <motion.ellipse
          cx="40"
          cy="44"
          rx="4.5"
          ry="5"
          fill="#58a6ff"
          style={{ translateX: springY, translateY: springX }}
          className="origin-center"
        />
        <motion.ellipse
          cx="60"
          cy="44"
          rx="4.5"
          ry="5"
          fill="#58a6ff"
          style={{ translateX: springY, translateY: springX }}
          className="origin-center"
        />
        <defs>
          <radialGradient id="visorGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#161b22" />
            <stop offset="100%" stopColor="#0d1117" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// ── typewriter text effect ──
function TypewriterText({ phrases }: { phrases: string[] }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhrase];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && currentChar === phrase.length) {
      // pause before deleting
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && currentChar === 0) {
      setIsDeleting(false);
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentChar((prev) => prev + (isDeleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [currentChar, isDeleting, currentPhrase, phrases]);

  return (
    <span className="text-[#58a6ff]">
      {phrases[currentPhrase].substring(0, currentChar)}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// ── main welcome hero ──
export default function WelcomeHero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const phrases = [
    "discover hidden gems",
    "pulse with the community",
    "ship what matters",
    "connect with vibe coders",
    "track your GitHub universe",
  ];

  return (
    <div className="relative w-full overflow-hidden bg-[#0d1117]">
      {/* ── sticky glassmorphic navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 bg-[#0d1117]/70 backdrop-blur-xl border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <svg height="32" viewBox="0 0 16 16" width="32" className="fill-white">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span className="text-white text-xl font-bold tracking-tight hidden sm:inline">GitPulse</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[15px] text-white/80 hover:text-white transition-colors font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md border border-white/20 text-[15px] text-white font-semibold hover:bg-white/10 transition-all"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ── hero section ── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6">
        {/* background image with parallax */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <img
            src="/git-pulse-wallp.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ minHeight: "120%" }}
          />
        </div>

        {/* gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/80 to-[#0d1117]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1117]/60 via-transparent to-[#0d1117]/60" />

        {/* radial glow behind center content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#58a6ff]/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#6e40c9]/[0.08] rounded-full blur-[100px] pointer-events-none" />

        {/* content block */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto mt-16">
          {/* copilot head */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            className="mb-8"
          >
            <CopilotHead />
          </motion.div>

          {/* massive headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.4 }}
            className="text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[1.1] tracking-tight text-white mb-6"
          >
            The pulse of
            <br />
            <span className="bg-gradient-to-r from-[#58a6ff] via-[#bc8cff] to-[#f778ba] bg-clip-text text-transparent">
              open source
            </span>
          </motion.h1>

          {/* sub-headline with typewriter */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.6 }}
            className="text-[clamp(1rem,2.5vw,1.35rem)] text-white/60 max-w-2xl leading-relaxed mb-10"
          >
            GitPulse is the social layer built on top of GitHub.
            <br className="hidden sm:block" />
            {" "}
            <TypewriterText phrases={phrases} />
          </motion.p>

          {/* cta buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-lg bg-white text-[#0d1117] text-[16px] font-bold hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]"
            >
              Sign up with GitHub
            </Link>
            <Link
              href="/explore"
              className="px-8 py-3.5 rounded-lg border border-white/20 text-[16px] text-white/80 font-semibold hover:text-white hover:border-white/40 hover:bg-white/[0.04] transition-all"
            >
              Explore trending
            </Link>
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── feature cards section ── */}
      <section className="relative py-24 sm:py-32 px-6 bg-[#0d1117]">
        {/* top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#58a6ff]/40 to-transparent" />

        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="text-[clamp(1.8rem,4vw,3rem)] font-bold text-white text-center mb-4 tracking-tight"
          >
            Built for developers who ship
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
            className="text-center text-white/50 text-lg mb-16 max-w-2xl mx-auto"
          >
            Everything you need to stay connected to the heartbeat of open source.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Smart Feed",
                desc: "An algorithmically curated timeline that surfaces the most impactful PRs, releases, and repos from your network.",
                gradient: "from-[#58a6ff]/10 to-transparent",
                borderColor: "border-[#58a6ff]/20",
                iconColor: "#58a6ff",
              },
              {
                title: "Ship Releases",
                desc: "Announce your launches directly to the community. Track reactions, discussions, and momentum in real-time.",
                gradient: "from-[#3fb950]/10 to-transparent",
                borderColor: "border-[#3fb950]/20",
                iconColor: "#3fb950",
              },
              {
                title: "Discover Devs",
                desc: "Find developers like you, trending projects, and hidden gems through intelligent recommendation algorithms.",
                gradient: "from-[#bc8cff]/10 to-transparent",
                borderColor: "border-[#bc8cff]/20",
                iconColor: "#bc8cff",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: i * 0.15 }}
                className={`relative p-8 rounded-2xl border ${card.borderColor} bg-gradient-to-b ${card.gradient} hover:border-white/20 transition-all group`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${card.iconColor}15` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: card.iconColor }}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#58a6ff] transition-colors">
                  {card.title}
                </h3>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── stats / social proof section ── */}
      <section className="relative py-20 px-6 bg-[#0d1117]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#6e40c9]/40 to-transparent" />

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "100M+", label: "developers worldwide" },
            { value: "420M+", label: "repositories tracked" },
            { value: "Real-time", label: "activity streaming" },
            { value: "Zero", label: "vendor lock-in" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 80, damping: 20 }}
            >
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── bottom cta ── */}
      <section className="relative py-24 sm:py-32 px-6 bg-[#0d1117]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#58a6ff]/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-white mb-6 tracking-tight"
          >
            Start pulsing
            <br />
            <span className="bg-gradient-to-r from-[#58a6ff] to-[#bc8cff] bg-clip-text text-transparent">
              with the community
            </span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
          >
            <Link
              href="/login"
              className="inline-block px-10 py-4 rounded-lg bg-white text-[#0d1117] text-[17px] font-bold hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.12)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            >
              Sign up for free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="border-t border-white/[0.06] py-12 px-6 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg height="20" viewBox="0 0 16 16" width="20" className="fill-white/40">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <span className="text-sm text-white/40">GitPulse 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <Link href="/explore" className="hover:text-white/60 transition-colors">Explore</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">About</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
