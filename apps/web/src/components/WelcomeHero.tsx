"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useInView,
} from "framer-motion";

// ── config ──
const ACCENT = "rgb(52, 211, 153)"; // desaturated emerald-400
const ACCENT_DIM = "rgba(52, 211, 153, 0.08)";
const BG = "#0a0a0f";
const SURFACE = "rgba(255,255,255,0.03)";
const BORDER = "rgba(255,255,255,0.06)";
const TEXT_PRIMARY = "rgba(255,255,255,0.92)";
const TEXT_SECONDARY = "rgba(255,255,255,0.5)";
const TEXT_TERTIARY = "rgba(255,255,255,0.3)";

// ── spring config for all interactive motion ──
const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

// ── stagger container ──
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING,
  },
};

// ── magnetic button ──
function MagneticButton({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "ghost";
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.15);
    y.set((e.clientY - cy) * 0.15);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    variant === "primary"
      ? "inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px] font-semibold transition-colors"
      : "inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px] font-medium transition-colors";

  const styles =
    variant === "primary"
      ? {
          backgroundColor: ACCENT,
          color: BG,
          border: "none",
          boxShadow: `0 0 0 1px ${ACCENT}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }
      : {
          backgroundColor: "transparent",
          color: TEXT_SECONDARY,
          border: `1px solid ${BORDER}`,
        };

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: springX, y: springY, ...styles }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileHover={{
        scale: 1.02,
        ...(variant === "ghost" ? { borderColor: "rgba(255,255,255,0.12)", color: TEXT_PRIMARY } : {}),
      }}
      whileTap={{ scale: 0.98, y: 1 }}
      className={base}
    >
      {children}
    </motion.a>
  );
}

// ── typewriter ──
function Typewriter({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[index];
    const speed = deleting ? 25 : 55;

    if (!deleting && charIndex === phrase.length) {
      const t = setTimeout(() => setDeleting(true), 2400);
      return () => clearTimeout(t);
    }
    if (deleting && charIndex === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }

    const t = setTimeout(
      () => setCharIndex((c) => c + (deleting ? -1 : 1)),
      speed
    );
    return () => clearTimeout(t);
  }, [charIndex, deleting, index, phrases]);

  return (
    <span style={{ color: ACCENT }}>
      {phrases[index].substring(0, charIndex)}
      <span className="animate-pulse" style={{ opacity: 0.6 }}>
        ▎
      </span>
    </span>
  );
}

// ── feature row item (zig-zag layout, not 3-column) ──
function FeatureRow({
  title,
  description,
  index: i,
}: {
  title: string;
  description: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = i % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ ...SPRING, delay: i * 0.1 }}
      className={`flex flex-col md:flex-row items-start gap-6 md:gap-16 ${
        !isEven ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* text block */}
      <div className="flex-1 min-w-0">
        <div
          className="w-2 h-2 rounded-full mb-5"
          style={{ backgroundColor: ACCENT }}
        />
        <h3
          className="text-xl md:text-2xl font-semibold tracking-tight mb-3"
          style={{ color: TEXT_PRIMARY }}
        >
          {title}
        </h3>
        <p
          className="text-[15px] leading-relaxed max-w-[50ch]"
          style={{ color: TEXT_SECONDARY }}
        >
          {description}
        </p>
      </div>

      {/* visual placeholder — liquid glass card */}
      <div
        className="flex-1 min-w-0 w-full md:w-auto aspect-[16/10] rounded-xl"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
          backdropFilter: "blur(20px)",
        }}
      />
    </motion.div>
  );
}

// ── main welcome hero ──
export default function WelcomeHero() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.96]);

  const phrases = [
    "discover hidden repos",
    "pulse with your network",
    "ship what matters",
    "track your github universe",
  ];

  const features = [
    {
      title: "Algorithmic feed",
      description:
        "A timeline that surfaces the most impactful PRs, releases, and repositories from your network. No noise, only signal.",
    },
    {
      title: "Ship announcements",
      description:
        "Announce your launches to the developer community. Track reactions, comments, and momentum as it builds.",
    },
    {
      title: "Developer discovery",
      description:
        "Find developers who share your stack, trending projects you missed, and repositories gaining traction before they blow up.",
    },
    {
      title: "Real-time activity",
      description:
        "See what your network is building right now. Every push, every PR, every star — streaming live from GitHub.",
    },
  ];

  return (
    <div style={{ backgroundColor: BG }} className="relative w-full overflow-hidden">
      {/* ── sticky glassmorphic nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 h-16"
        style={{
          backgroundColor: "rgba(10, 10, 15, 0.75)",
          backdropFilter: "blur(20px) saturate(1.2)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <svg height="26" viewBox="0 0 16 16" width="26" fill="white" opacity="0.9">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span
            className="text-[17px] font-semibold tracking-tight hidden sm:inline"
            style={{ color: TEXT_PRIMARY }}
          >
            GitPulse
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[14px] font-medium transition-colors hover:opacity-100"
            style={{ color: TEXT_SECONDARY }}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md text-[14px] font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: ACCENT,
              color: BG,
            }}
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ── hero section — asymmetric split-screen layout ── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-[100dvh] flex items-center"
      >
        {/* right-side image — positioned absolutely to bleed into the dark left */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/hero-blend.png"
            alt=""
            className="absolute right-0 top-0 h-full w-full object-cover object-right"
            style={{ opacity: 0.5 }}
          />
          {/* gradient mask: dark left, transparent right */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${BG} 0%, ${BG} 30%, transparent 70%)`,
            }}
          />
          {/* bottom fade */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${BG} 0%, transparent 40%)`,
            }}
          />
        </div>

        {/* content — left-aligned */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 pt-32 pb-20"
        >
          <div className="max-w-xl">
            {/* badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide uppercase"
                style={{
                  color: ACCENT,
                  backgroundColor: ACCENT_DIM,
                  border: `1px solid rgba(52, 211, 153, 0.15)`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: ACCENT }}
                />
                now in public beta
              </span>
            </motion.div>

            {/* headline — left-aligned, weight-controlled, no gradient text */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-6"
              style={{ color: TEXT_PRIMARY }}
            >
              The social layer
              <br />
              for open source
            </motion.h1>

            {/* sub copy */}
            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg leading-relaxed max-w-[50ch] mb-4"
              style={{ color: TEXT_SECONDARY }}
            >
              GitPulse is the developer network built on top of GitHub.
              Follow builders, ship releases, and stay connected to what matters.
            </motion.p>

            {/* typewriter */}
            <motion.p
              variants={fadeUp}
              className="text-base leading-relaxed mb-10 font-mono"
            >
              <Typewriter phrases={phrases} />
            </motion.p>

            {/* ctas */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3"
            >
              <MagneticButton href="/login" variant="primary">
                Get started
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </MagneticButton>
              <MagneticButton href="/explore" variant="ghost">
                Explore trending
              </MagneticButton>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── divider line ── */}
      <div className="w-full px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div style={{ height: 1, backgroundColor: BORDER }} />
      </div>

      {/* ── features — zig-zag layout ── */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={SPRING}
          className="mb-20"
        >
          <p
            className="text-[12px] font-medium tracking-widest uppercase mb-4"
            style={{ color: ACCENT }}
          >
            Features
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight max-w-md"
            style={{ color: TEXT_PRIMARY }}
          >
            Everything you need.
            <br />
            <span style={{ color: TEXT_TERTIARY }}>Nothing you don&apos;t.</span>
          </h2>
        </motion.div>

        <div className="flex flex-col gap-20 md:gap-28">
          {features.map((f, i) => (
            <FeatureRow key={f.title} title={f.title} description={f.description} index={i} />
          ))}
        </div>
      </section>

      {/* ── divider ── */}
      <div className="w-full px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div style={{ height: 1, backgroundColor: BORDER }} />
      </div>

      {/* ── stats — horizontal, monospace numbers ── */}
      <section className="py-20 sm:py-24 px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { value: "100M+", label: "developers on github" },
            { value: "420M+", label: "repositories tracked" },
            { value: "<50ms", label: "feed response time" },
            { value: "0", label: "vendor lock-in" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...SPRING, delay: i * 0.08 }}
            >
              <div
                className="text-3xl sm:text-4xl font-bold tracking-tight font-mono mb-2"
                style={{ color: TEXT_PRIMARY }}
              >
                {stat.value}
              </div>
              <div
                className="text-[13px] tracking-wide"
                style={{ color: TEXT_TERTIARY }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── divider ── */}
      <div className="w-full px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <div style={{ height: 1, backgroundColor: BORDER }} />
      </div>

      {/* ── bottom cta — left-aligned ── */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="max-w-lg"
        >
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tighter leading-none mb-6"
            style={{ color: TEXT_PRIMARY }}
          >
            Ready to start?
          </h2>
          <p
            className="text-base leading-relaxed mb-8 max-w-[45ch]"
            style={{ color: TEXT_SECONDARY }}
          >
            Join thousands of developers already using GitPulse to stay
            connected to the open source community.
          </p>
          <MagneticButton href="/login" variant="primary">
            Sign up with GitHub
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </MagneticButton>
        </motion.div>
      </section>

      {/* ── footer ── */}
      <footer
        className="py-10 px-6 sm:px-10 lg:px-20"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg height="16" viewBox="0 0 16 16" width="16" style={{ fill: TEXT_TERTIARY }}>
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <span className="text-[13px]" style={{ color: TEXT_TERTIARY }}>
              GitPulse · 2026
            </span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Explore", href: "/explore" },
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] transition-colors hover:opacity-80"
                style={{ color: TEXT_TERTIARY }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
