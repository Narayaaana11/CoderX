import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Command,
  CornerDownLeft,
  Database,
  Github,
  Hexagon,
  Menu,
  Network,
  Search,
  Star,
  Twitter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/openlovable/button';
import { cn } from '@/lib/utils';
import {
  capabilityRows,
  faqs,
  featureCards,
  navLinks,
  pricingTiers,
  segmentProfiles,
  starterBlueprints,
  stats,
  techStack,
  testimonials,
  trustSignals,
  workflowSteps,
  type FeatureItem,
  type SegmentKey,
  type SegmentProfile,
} from './LandingPage.data';

export function GridBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    />
  );
}

export function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10 opacity-[0.015]"
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)`,
      }}
    />
  );
}

export function CursorGlow({ enabled }: { enabled: boolean }) {
  const [position, setPosition] = useState({ x: -200, y: -200 });

  useEffect(() => {
    if (!enabled) return;
    let rafId = 0;
    const latest = { x: -200, y: -200 };
    const commitPosition = () => {
      rafId = 0;
      setPosition({ x: latest.x, y: latest.y });
    };
    const onMove = (event: MouseEvent) => {
      latest.x = event.clientX;
      latest.y = event.clientY;
      if (!rafId) rafId = window.requestAnimationFrame(commitPosition);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-30 hidden h-96 w-96 rounded-full blur-3xl lg:block"
      style={{
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 50%, transparent 70%)',
      }}
      animate={{ x: position.x - 192, y: position.y - 192 }}
      transition={{ type: 'spring', damping: 40, stiffness: 150, mass: 0.2 }}
    />
  );
}

export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10 opacity-[0.02]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '160px 160px',
      }}
    />
  );
}

export function GlowBackdrop() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-8%] top-[-15%] h-[50rem] w-[50rem] rounded-full bg-indigo-600/20 blur-[200px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute right-[-8%] top-[5%] h-[42rem] w-[42rem] rounded-full bg-cyan-500/15 blur-[180px]"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 6,
          }}
          className="absolute bottom-[-15%] left-[20%] h-[45rem] w-[45rem] rounded-full bg-emerald-400/10 blur-[220px]"
        />
        <motion.div
          animate={{ x: [-30, 30, -30], y: [-15, 15, -15] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[15%] top-[35%] h-[28rem] w-[28rem] rounded-full bg-violet-500/8 blur-[160px]"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_8%_12%,rgba(99,102,241,0.12),transparent_38%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.08),transparent_40%),linear-gradient(180deg,#050810_0%,#020409_100%)]" />
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function PremiumNavbar({
  onStart,
  activeSection,
  scrollProgress,
}: {
  onStart: (prompt?: string) => void;
  activeSection: string;
  scrollProgress: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed left-0 top-0 z-50 w-full transition-all duration-500',
        scrolled
          ? 'border-b border-white/[0.06] bg-[#050810]/85 shadow-[0_1px_0_rgba(99,102,241,0.1)] backdrop-blur-2xl'
          : 'bg-transparent',
      )}
    >
      {/* Top glow line */}
      <div
        className={cn(
          'absolute top-0 h-px w-full transition-opacity duration-700 bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent',
          scrolled ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* Scroll progress bar */}
      <div className="absolute bottom-0 left-0 h-px w-full">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-[width] duration-150"
          style={{ width: `${Math.max(1, scrollProgress * 100)}%` }}
        />
      </div>

      <div className="mx-auto flex h-18 w-full items-center justify-between px-5 md:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-[0_0_24px_rgba(99,102,241,0.6)]">
            <Hexagon className="h-4 w-4 text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-lg bg-white/0 transition group-hover:bg-white/10" />
            {/* Corner accents */}
            <span className="absolute -top-[1px] -left-[1px] h-2 w-2 border-t border-l border-cyan-400/60" />
            <span className="absolute -bottom-[1px] -right-[1px] h-2 w-2 border-b border-r border-cyan-400/60" />
          </div>
          <div>
            <p className="font-mono text-[15px] font-bold tracking-[0.12em] text-white uppercase">
              CODER<span className="text-cyan-400">X</span>
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">Neural Product Studio</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-400 lg:flex">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'group relative font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                activeSection === item.href.slice(1) ? 'text-cyan-300' : 'hover:text-white',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-300',
                  activeSection === item.href.slice(1) ? 'w-full' : 'w-0 group-hover:w-full',
                )}
              />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            variant="outline"
            onClick={() => onStart()}
            className="border-white/10 bg-white/[0.03] font-mono text-xs uppercase tracking-wider text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/5 hover:text-cyan-300"
          >
            Open Workspace
          </Button>
          <Button
            onClick={() =>
              onStart(
                'Build a premium SaaS platform with onboarding, analytics, admin roles, billing, and deployment-ready architecture.',
              )
            }
            className="group relative gap-2 overflow-hidden bg-gradient-to-r from-indigo-600 to-cyan-500 font-mono text-xs uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(99,102,241,0.5)] transition-all hover:shadow-[0_6px_28px_rgba(99,102,241,0.7)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Initialize Build
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded border border-white/15 p-2 text-slate-300 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-b border-white/[0.08] bg-[#050810]/95 px-6 py-5 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-4 font-mono text-xs uppercase tracking-[0.18em] text-slate-300">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-1 transition hover:text-cyan-300"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <Button
              className="mt-5 w-full bg-gradient-to-r from-indigo-600 to-cyan-500 font-mono text-xs uppercase tracking-wider text-white"
              onClick={() => {
                setMobileOpen(false);
                onStart();
              }}
            >
              Initialize Build
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────

export function TrustStripSection() {
  return (
    <section className="relative z-10 px-6 py-6">
      <div className="mx-auto w-full">
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 backdrop-blur-sm">
          <div
            className="flex items-center gap-3"
            style={{
              animation: 'marquee 32s linear infinite',
              width: 'max-content',
            }}
          >
            {[...trustSignals, ...trustSignals, ...trustSignals].map((signal, index) => (
              <span
                key={`${signal}-${index}`}
                className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap"
              >
                <span className="h-1 w-1 rounded-full bg-cyan-400" />
                {signal}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-33.333%) } }`}</style>
    </section>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

export function HeroSection({
  onStart,
  reducedMotion,
  ecoMode,
}: {
  onStart: (prompt?: string) => void;
  reducedMotion: boolean;
  ecoMode: boolean;
}) {
  const [segment, setSegment] = useState<SegmentKey>('founder');
  const segmentData = segmentProfiles[segment];
  const [activePhrase, setActivePhrase] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);

  const paletteItems = useMemo(() => {
    const normalized = paletteQuery.trim().toLowerCase();
    if (!normalized) return segmentData.quickPrompts;
    return segmentData.quickPrompts.filter(
      (item) => item.label.toLowerCase().includes(normalized) || item.prompt.toLowerCase().includes(normalized),
    );
  }, [paletteQuery, segmentData.quickPrompts]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(
      () => setActivePhrase((prev) => (prev + 1) % segmentData.rotatingPhrases.length),
      2800,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion, segmentData.rotatingPhrases.length]);

  useEffect(() => {
    setActivePhrase(0);
  }, [segment]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        setPaletteQuery('');
        setActivePaletteIndex(0);
        return;
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setPaletteQuery('');
        setActivePaletteIndex(0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const prevOverflow = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = '';
    };
  }, [paletteOpen]);

  useEffect(() => {
    setActivePaletteIndex(0);
  }, [paletteQuery, segment, paletteOpen]);

  const launchFromPalette = (prompt: string) => {
    onStart(prompt);
    setPaletteOpen(false);
    setPaletteQuery('');
    setActivePaletteIndex(0);
  };

  return (
    <section className="snap-section relative flex min-h-screen items-center px-6 pb-20 pt-28 z-10" id="hero">
      {/* Top rule */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="mx-auto grid w-full items-center gap-14 lg:grid-cols-2">
        {/* Left column */}
        <div>
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded border border-cyan-400/30 bg-cyan-400/5 px-4 py-2"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
              System Online — Neural Studio v4.6
            </span>
          </motion.div>

          {/* Segment switcher */}
          <div className="mt-5 flex gap-2">
            {(Object.entries(segmentProfiles) as [SegmentKey, SegmentProfile][]).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSegment(key)}
                className={cn(
                  'rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all',
                  segment === key
                    ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200',
                )}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-7 font-mono text-5xl font-bold leading-[1.02] tracking-tight text-white md:text-[4.25rem]"
          >
            Turn ambitious ideas into
            <span className="relative mt-1 block">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={segmentData.rotatingPhrases[activePhrase]}
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent"
                >
                  {segmentData.rotatingPhrases[activePhrase]}
                </motion.span>
              </AnimatePresence>
              {/* Underline accent */}
              <span className="absolute -bottom-1 left-0 h-px w-3/4 bg-gradient-to-r from-indigo-400/60 via-cyan-300/40 to-transparent" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mt-7 max-w-lg text-base leading-relaxed text-slate-400"
          >
            {segmentData.description}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              onClick={() =>
                onStart(
                  'Design and build a premium startup website with immersive motion, 3D visuals, and conversion-focused storytelling.',
                )
              }
              className="group relative h-12 gap-2 overflow-hidden bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 font-mono text-sm uppercase tracking-wider text-white shadow-[0_4px_24px_rgba(99,102,241,0.55)] transition-all hover:shadow-[0_8px_32px_rgba(99,102,241,0.7)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Initialize Build
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="outline"
              className="h-12 border-white/10 bg-white/[0.03] px-8 font-mono text-sm uppercase tracking-wider text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-200"
              asChild
            >
              <a href="#demo">Live Demo</a>
            </Button>
          </motion.div>

          {/* Capability chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-7 flex flex-wrap gap-2"
          >
            {['WebGL rendering', 'Scroll choreography', 'AI code generation', 'Edge deployment'].map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-1.5 rounded border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 transition hover:border-white/15 hover:text-slate-300"
              >
                <span className="h-1 w-1 rounded-full bg-indigo-400/60" />
                {chip}
              </span>
            ))}
          </motion.div>

          {/* Quick prompts */}
          <div className="mt-7 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Quick Start Protocols</p>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-1.5 rounded border border-white/[0.1] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
              >
                <Command className="h-3 w-3" />K
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {segmentData.quickPrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onStart(item.prompt)}
                  className="group rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:border-indigo-400/40 hover:bg-indigo-500/8 hover:text-indigo-200"
                >
                  <span className="mr-2 text-indigo-500/50 group-hover:text-indigo-400/70">▹</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics ticker */}
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.06] bg-black/30 py-2.5 px-3">
            <div className="flex items-center gap-1 mb-2">
              <Activity className="h-3 w-3 text-emerald-400" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                Performance Telemetry
              </span>
            </div>
            <motion.div
              key={segment}
              animate={reducedMotion ? undefined : { x: ['0%', '-50%'] }}
              transition={reducedMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'linear' }}
              className="flex min-w-max items-center gap-2"
            >
              {[...segmentData.metrics, ...segmentData.metrics].map((metric, index) => (
                <div
                  key={`${metric.label}-${index}`}
                  className="flex items-baseline gap-2 rounded border border-white/[0.06] bg-white/[0.03] px-3 py-1.5"
                >
                  <span className="font-mono text-sm font-bold text-emerald-300">{metric.value}</span>
                  <span className="font-mono text-[10px] text-slate-500">{metric.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right column — 3D canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="hero-orb relative mx-auto h-[34rem] w-full max-w-[38rem]"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-transparent to-cyan-500/10 blur-3xl" />

          {/* Panel frame */}
          <div className="absolute inset-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#050810]/95 shadow-[0_40px_80px_rgba(2,4,18,0.95)]">
            {/* Corner brackets */}
            <span className="absolute top-3 left-3 h-5 w-5 border-t border-l border-cyan-400/50" />
            <span className="absolute top-3 right-3 h-5 w-5 border-t border-r border-cyan-400/50" />
            <span className="absolute bottom-3 left-3 h-5 w-5 border-b border-l border-cyan-400/50" />
            <span className="absolute bottom-3 right-3 h-5 w-5 border-b border-r border-cyan-400/50" />

            {/* Inner inset */}
            <div className="absolute inset-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.2),transparent_55%),radial-gradient(ellipse_at_70%_80%,rgba(34,211,238,0.12),transparent_50%),#020409]">
              {ecoMode ? (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgba(99,102,241,0.28),transparent_48%),radial-gradient(circle_at_70%_70%,rgba(34,211,238,0.2),transparent_50%),#020409] px-8 text-center">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
                      Eco Mode Active
                    </p>
                    <p className="mt-2 font-mono text-xs text-slate-300">
                      3D canvas paused for stability. Open workspace and start generation.
                    </p>
                  </div>
                </div>
              ) : (
                <Canvas
                  dpr={ecoMode ? [1, 1.1] : [1, 1.25]}
                  frameloop={reducedMotion || ecoMode ? 'demand' : 'always'}
                  gl={{
                    antialias: false,
                    powerPreference: ecoMode ? 'low-power' : 'high-performance',
                  }}
                >
                  <PerspectiveCamera makeDefault position={[0, 0, 4.5]} />
                  <color attach="background" args={['#020409']} />
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[2, 3, 2]} intensity={1.2} color="#7dd3fc" />
                  <pointLight position={[-2.5, -1, 2]} intensity={2.5} color="#22d3ee" />
                  <pointLight position={[3, 1, -2]} intensity={1.0} color="#818cf8" />
                  <HeroCore reducedMotion={reducedMotion || ecoMode} />
                  <ParticleField count={ecoMode ? 320 : 900} reducedMotion={reducedMotion || ecoMode} />
                </Canvas>
              )}
            </div>

            {/* HUD overlays */}
            <div className="absolute bottom-6 left-6 rounded border border-cyan-400/20 bg-black/70 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Engine</p>
              <p className="mt-0.5 font-mono text-[11px] text-cyan-300">AI × WebGL 2.0</p>
            </div>
            <div className="absolute right-6 top-6 rounded border border-emerald-400/20 bg-black/70 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Status</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px] text-emerald-300">Live</span>
              </div>
            </div>
            {/* Scan line effect */}
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 2,
              }}
              className="absolute inset-x-3 h-8 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none"
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#showcase"
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600 transition-colors hover:text-slate-400"
      >
        <span>Scroll to explore</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </motion.a>

      {/* Command palette */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-28 backdrop-blur-sm"
            onClick={() => {
              setPaletteOpen(false);
              setPaletteQuery('');
            }}
          >
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-xl border border-white/[0.1] bg-[#050810]/98 p-3 shadow-[0_30px_80px_rgba(2,4,18,0.9)]"
            >
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  autoFocus
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActivePaletteIndex((prev) => (paletteItems.length ? (prev + 1) % paletteItems.length : 0));
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActivePaletteIndex((prev) =>
                        paletteItems.length ? (prev - 1 + paletteItems.length) % paletteItems.length : 0,
                      );
                    }
                    if (e.key === 'Enter') {
                      const selected = paletteItems[activePaletteIndex];
                      if (selected) launchFromPalette(selected.prompt);
                    }
                  }}
                  placeholder={`Search ${segmentData.label} protocols...`}
                  className="w-full bg-transparent font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
                <span className="font-mono text-[10px] text-slate-500">ESC to close</span>
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto">
                {paletteItems.length ? (
                  paletteItems.map((item, index) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => launchFromPalette(item.prompt)}
                      onMouseEnter={() => setActivePaletteIndex(index)}
                      className={cn(
                        'mt-1 w-full rounded-lg border px-3 py-2.5 text-left transition',
                        index === activePaletteIndex
                          ? 'border-indigo-400/40 bg-indigo-500/10'
                          : 'border-transparent bg-white/[0.02] hover:border-indigo-400/30 hover:bg-indigo-500/8',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-sm text-slate-100">{item.label}</p>
                        {index === activePaletteIndex && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-indigo-300">
                            <CornerDownLeft className="h-3 w-3" />
                            run
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-slate-500">{item.prompt}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-4 font-mono text-sm text-slate-500">No protocols match.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── 3D Objects ───────────────────────────────────────────────────────────────

export function HeroCore({ reducedMotion }: { reducedMotion: boolean }) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state: { clock: { elapsedTime: number } }, delta: number) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (outer.current) {
      outer.current.rotation.x += delta * 0.28;
      outer.current.rotation.y += delta * 0.42;
    }
    if (inner.current) {
      inner.current.rotation.x -= delta * 0.5;
      inner.current.rotation.z += delta * 0.28;
    }
    if (ring1.current) {
      ring1.current.rotation.z += delta * 0.55;
      ring1.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.45) * 0.18;
    }
    if (ring2.current) {
      ring2.current.rotation.z -= delta * 0.38;
      ring2.current.rotation.y = Math.sin(t * 0.35) * 0.25;
    }
    if (ring3.current) {
      ring3.current.rotation.x += delta * 0.22;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.6}
      rotationIntensity={reducedMotion ? 0 : 0.6}
      floatIntensity={reducedMotion ? 0 : 1.0}
    >
      <group>
        <mesh ref={inner}>
          <octahedronGeometry args={[0.65, 0]} />
          <meshPhysicalMaterial
            color="#22d3ee"
            emissive="#0e7490"
            emissiveIntensity={0.9}
            metalness={0.7}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
        <mesh ref={outer}>
          <torusKnotGeometry args={[1.05, 0.26, 240, 32]} />
          <meshPhysicalMaterial
            color="#818cf8"
            metalness={0.6}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive="#6366f1"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh scale={1.12}>
          <torusKnotGeometry args={[1.05, 0.26, 240, 32]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08} />
        </mesh>
        <mesh ref={ring1}>
          <torusGeometry args={[1.7, 0.022, 8, 140]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.05, 0.016, 8, 120]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={ring3} rotation={[0, Math.PI / 5, 0]}>
          <torusGeometry args={[2.35, 0.012, 8, 100]} />
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
      </group>
    </Float>
  );
}

export function ParticleField({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const points = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#818cf8'),
      new THREE.Color('#22d3ee'),
      new THREE.Color('#34d399'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#7dd3fc'),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      const c = palette[Math.floor(Math.random() * palette.length)]!;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame((_: unknown, delta: number) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y += delta * 0.025;
    points.current.rotation.x += delta * 0.012;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.016} vertexColors transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

// ─── Showcase Section ─────────────────────────────────────────────────────────

export function ShowcaseSection({ reducedMotion, ecoMode }: { reducedMotion: boolean; ecoMode: boolean }) {
  const { scrollYProgress } = useScroll();
  const rotateY = useTransform(scrollYProgress, [0, 1], [-18, 16]);
  const translateY = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section id="showcase" className="story-grid snap-section relative z-10 px-6 py-28">
      <div className="mx-auto grid w-full gap-14 lg:grid-cols-[1fr_1.1fr] items-center">
        <div className="story-block">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400">// Interactive 3D Showcase</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl leading-[1.05]">
            Scroll-driven perspective.
            <br />
            <span className="text-slate-400">Every angle revealed.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-400">
            Mouse-responsive lighting, cinematic camera movement, and controlled depth cues create a truly immersive
            product reveal.
          </p>
          <div className="mt-8 space-y-3">
            {[
              {
                label: 'Camera transition timeline',
                color: 'border-indigo-400/20 bg-indigo-500/5 text-indigo-300',
              },
              {
                label: 'Reactive depth-based shadows',
                color: 'border-cyan-400/20 bg-cyan-500/5 text-cyan-300',
              },
              {
                label: 'GPU-optimized object transforms',
                color: 'border-emerald-400/20 bg-emerald-500/5 text-emerald-300',
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-3 rounded border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition hover:brightness-125',
                  item.color,
                )}
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <motion.div style={{ rotateY, y: translateY }} className="story-block">
          <div className="relative h-[30rem] rounded-2xl border border-white/[0.08] bg-[#050810]/90 p-1.5 shadow-[0_30px_80px_rgba(2,4,18,0.8)]">
            {/* Corner brackets */}
            <span className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-cyan-400/50" />
            <span className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-cyan-400/50" />
            <span className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-cyan-400/50" />
            <span className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-cyan-400/50" />
            <div className="h-full overflow-hidden rounded-xl border border-white/[0.05] bg-[#020409]">
              {ecoMode ? (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_35%_30%,rgba(34,211,238,0.18),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.18),transparent_50%),#020409] px-6 text-center">
                  <p className="font-mono text-xs text-slate-300">
                    3D showcase paused in eco mode to avoid GPU context resets.
                  </p>
                </div>
              ) : (
                <Canvas
                  dpr={ecoMode ? [1, 1.1] : [1, 1.25]}
                  frameloop={reducedMotion || ecoMode ? 'demand' : 'always'}
                  gl={{
                    antialias: false,
                    powerPreference: ecoMode ? 'low-power' : 'high-performance',
                  }}
                >
                  <ambientLight intensity={0.5} />
                  <pointLight position={[0, 2, 2]} intensity={1.5} color="#22d3ee" />
                  <pointLight position={[0, -2, -2]} intensity={1.0} color="#818cf8" />
                  <ShowcaseObject reducedMotion={reducedMotion || ecoMode} />
                </Canvas>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function ShowcaseObject({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += delta * 0.25;
    groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
    if (coreRef.current) coreRef.current.rotation.y -= delta * 0.6;
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.7;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 0.5;
    if (ring3Ref.current) ring3Ref.current.rotation.y -= delta * 0.4;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshPhysicalMaterial
          color="#6366f1"
          metalness={0.7}
          roughness={0.1}
          clearcoat={1}
          emissive="#4338ca"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh scale={1.1}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.12} />
      </mesh>
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.028, 12, 140]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.7} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[1.9, 0.018, 8, 120]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[2.2, 0.013, 8, 100]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.35} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

export function FeaturesSection() {
  return (
    <section id="features" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">// Platform Core Modules</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Engineered for impact.</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureCard({ feature }: { feature: FeatureItem }) {
  const [transform, setTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg)');
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      whileInView={{ opacity: [0, 1], y: [24, 0] }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - rect.left,
          dy = e.clientY - rect.top;
        const rotY = ((dx / rect.width) * 2 - 1) * 6;
        const rotX = -(((dy / rect.height) * 2 - 1) * 6);
        setTransform(`perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setTransform('perspective(900px) rotateX(0deg) rotateY(0deg)');
        setHovered(false);
      }}
      className="story-block relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#080c18]/80 p-7 shadow-[0_20px_50px_rgba(2,4,18,0.6)] transition-all duration-300 hover:border-white/[0.14]"
      style={{ transform }}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300',
          feature.accent,
          hovered ? 'opacity-100' : 'opacity-40',
        )}
      />

      {/* Tag */}
      <div className="relative mb-5 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">{feature.tag}</span>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-black/40')}>
          <feature.icon className={cn('h-5 w-5', feature.iconColor)} />
        </div>
      </div>

      <div className="relative">
        <h3 className="font-mono text-xl font-bold text-white">{feature.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.description}</p>
      </div>

      {/* Bottom rule */}
      <div className="relative mt-6 h-px w-full overflow-hidden">
        <motion.div
          animate={hovered ? { x: ['-100%', '100%'] } : { x: '-100%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
        />
      </div>
    </motion.article>
  );
}

// ─── Builder Blueprints ───────────────────────────────────────────────────────

export function BuilderBlueprintsSection({ onStart }: { onStart: (prompt?: string) => void }) {
  return (
    <section className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400">// Starter Blueprints</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Launch from proven templates.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-400">
            Each blueprint fires a focused prompt that generates practical architecture and production-ready flow.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {starterBlueprints.map((item, index) => (
            <motion.article
              key={item.title}
              whileInView={{ opacity: [0, 1], y: [20, 0] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="story-block group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#080c18]/80 p-7 transition-all duration-300 hover:border-white/[0.14]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded border border-white/[0.1] bg-white/[0.04] transition-colors group-hover:border-cyan-400/30 group-hover:bg-cyan-400/5">
                <item.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="font-mono text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Button
                onClick={() => onStart(item.prompt)}
                className="mt-7 w-full bg-gradient-to-r from-indigo-600 to-cyan-500 font-mono text-xs uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_22px_rgba(99,102,241,0.5)]"
              >
                Deploy Blueprint
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Workflow Section ─────────────────────────────────────────────────────────

export function WorkflowSection() {
  return (
    <section className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0a0f20]/80 to-[#050810]/90 p-8 md:p-14">
        <div className="story-block text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">// Build Protocol</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">From intent to shipped product.</h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              whileInView={{ opacity: [0, 1], y: [16, 0] }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="story-block relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-white/[0.1] bg-white/[0.05]">
                  <step.icon className="h-4.5 w-4.5 text-cyan-300" />
                </div>
                <span className="font-mono text-2xl font-bold text-white/[0.06]">{step.num}</span>
              </div>
              <h3 className="font-mono text-base font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.detail}</p>
              {index < workflowSteps.length - 1 && (
                <div className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Demo Section ─────────────────────────────────────────────────────

export function ProductDemoSection() {
  const [activeTab, setActiveTab] = useState<'insights' | 'preview' | 'deployment'>('insights');
  const tabs = [
    { id: 'insights', label: 'AI Insights' },
    { id: 'preview', label: 'Live Preview' },
    { id: 'deployment', label: 'Deploy Plan' },
  ] as const;

  return (
    <section id="demo" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto grid w-full items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
        <div className="story-block">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">// Runtime Telemetry</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl leading-[1.05]">
            Concept to production.
            <br />
            <span className="text-slate-400">One visual flow.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-400">
            Architecture, preview validation, and deployment readiness — all without leaving the interface.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-all',
                  activeTab === tab.id
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:text-slate-200',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="story-block rounded-xl border border-white/[0.08] bg-[#080c18]/90 p-1.5">
          <div className="overflow-hidden rounded-lg border border-white/[0.05] bg-[#020409]/90 p-5">
            {/* Panel header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400/70" />
                <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
              </div>
              <div className="rounded border border-white/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {activeTab === 'insights'
                  ? 'Insight Engine'
                  : activeTab === 'preview'
                    ? 'Preview Pipeline'
                    : 'Deploy Analysis'}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[62, 84, 48, 92].map((value, index) => (
                <div key={`${value}-${index}`} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Metric {index + 1}
                    </p>
                    <span className="font-mono text-[11px] text-slate-300">{value}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${value}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.2,
                        delay: index * 0.1,
                        ease: 'easeOut',
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-4 font-mono text-[12px] leading-relaxed text-slate-400">
              <span className="text-cyan-400">{'>'} </span>
              {activeTab === 'insights' &&
                'AI identifies bottlenecks, suggests upgrades, prioritizes high-impact actions.'}
              {activeTab === 'preview' &&
                'Live snapshots update as generated files change, preserving design fidelity.'}
              {activeTab === 'deployment' &&
                'Checks validate environments, secure keys, and confirm readiness before shipping.'}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Capability Matrix ────────────────────────────────────────────────────────

export function CapabilityMatrixSection() {
  return (
    <section className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block mb-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">// Capability Matrix</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">What CoderX delivers.</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#080c18]/80">
          <div className="border-b border-white/[0.06] px-6 py-3">
            <div className="grid gap-4 md:grid-cols-[160px_1fr]">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600">Module</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600">Capabilities</span>
            </div>
          </div>
          {capabilityRows.map((row, index) => (
            <motion.div
              key={row.area}
              whileInView={{ opacity: [0, 1] }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className={cn(
                'story-block grid gap-4 px-6 py-5 md:grid-cols-[160px_1fr]',
                index < capabilityRows.length - 1 && 'border-b border-white/[0.05]',
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">{row.area}</span>
              <span className="text-sm text-slate-300">{row.supports}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Tech Stack Section ───────────────────────────────────────────────────────

export function TechStackSection() {
  return (
    <section id="stack" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0a0f20]/80 to-[#050810]/90 p-8 md:p-14">
        <div className="story-block text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400">// Technology Stack</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Performance primitives.</h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {techStack.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="story-block group cursor-default rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-base font-bold text-white">{tech.name}</p>
                <div className={cn('rounded border bg-black/20 p-1.5', tech.color.split(' ').slice(1).join(' '))}>
                  <tech.icon className={cn('h-3.5 w-3.5', tech.color.split(' ')[0])} />
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 transition-colors group-hover:text-slate-400">
                {tech.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────

export function StatCounter({ value, suffix, decimal }: { value: number; suffix: string; decimal?: boolean }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        const steps = 55,
          duration = 1800,
          interval = duration / steps;
        let step = 0;
        const timer = window.setInterval(() => {
          step++;
          const progress = step / steps;
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * value;
          setDisplay(parseFloat(decimal ? current.toFixed(1) : String(Math.round(current))));
          if (step >= steps) {
            window.clearInterval(timer);
            setDisplay(value);
          }
        }, interval);
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, decimal]);

  return (
    <div ref={ref} className="font-mono text-4xl font-bold text-white md:text-5xl">
      {decimal ? display.toFixed(1) : display.toLocaleString()}
      {suffix}
    </div>
  );
}

export function StatsSection({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <section id="stats" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block mb-14 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400">// System Metrics</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Trusted by builders worldwide.</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileInView={{ opacity: [0, 1], y: [28, 0] }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="story-block relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#080c18]/80 p-7 text-center"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
              {reducedMotion ? (
                <div className="font-mono text-4xl font-bold text-white md:text-5xl">
                  {stat.decimal ? stat.value.toFixed(1) : stat.value.toLocaleString()}
                  {stat.suffix}
                </div>
              ) : (
                <StatCounter value={stat.value} suffix={stat.suffix} decimal={stat.decimal} />
              )}
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export function TestimonialsSection({ reducedMotion }: { reducedMotion: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => setActive((prev) => (prev + 1) % testimonials.length), 4500);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const selected = testimonials[active] ?? testimonials[0];
  if (!selected) return null;

  return (
    <section id="testimonials" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">// User Testimonials</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Category leaders choose CoderX.</h2>
        </div>

        <div className="story-block mt-14 overflow-hidden rounded-xl border border-white/[0.08] bg-[#080c18]/80 p-8 md:p-12">
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"
            style={{ position: 'relative', marginBottom: '24px' }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-indigo-400/30 bg-gradient-to-br from-indigo-500/40 to-cyan-500/30 font-mono text-sm font-bold text-white shadow-[0_0_18px_rgba(99,102,241,0.3)]">
                  {selected.avatar}
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-white">{selected.name}</p>
                  <p className="font-mono text-[11px] text-slate-400">{selected.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-0.5">
                  {Array.from({ length: selected.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-lg leading-relaxed text-slate-200 md:text-xl">
                <span className="font-mono text-3xl text-indigo-400/40">"</span>
                {selected.quote}
                <span className="font-mono text-3xl text-indigo-400/40">"</span>
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    index === active ? 'w-8 bg-cyan-400' : 'w-1.5 bg-white/20',
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="rounded border border-white/[0.1] bg-white/[0.03] p-2 text-slate-400 hover:border-white/20 hover:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActive((prev) => (prev + 1) % testimonials.length)}
                className="rounded border border-white/[0.1] bg-white/[0.03] p-2 text-slate-400 hover:border-white/20 hover:text-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export function PricingSection({ onStart }: { onStart: (prompt?: string) => void }) {
  return (
    <section id="pricing" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block mb-14 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">// Pricing Tiers</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Start free. Scale ready.</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              whileInView={{ opacity: [0, 1], y: [28, 0] }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className={cn(
                'story-block relative flex flex-col overflow-hidden rounded-xl border p-7',
                tier.highlight
                  ? 'border-indigo-400/40 bg-gradient-to-b from-indigo-500/[0.12] to-[#080c18]/95 shadow-[0_0_50px_rgba(99,102,241,0.2)]'
                  : 'border-white/[0.08] bg-[#080c18]/80',
              )}
            >
              {tier.highlight && (
                <>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-200">
                    Most Popular
                  </div>
                </>
              )}

              <p className="font-mono text-lg font-bold text-white">{tier.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && <span className="font-mono text-sm text-slate-400">{tier.period}</span>}
              </div>
              <p className="mt-2 font-mono text-[11px] text-slate-500">{tier.description}</p>

              <ul className="mt-7 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 font-mono text-[12px] text-slate-300">
                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-emerald-400/30 bg-emerald-500/15 text-[9px] text-emerald-300">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onStart()}
                variant={tier.highlight ? 'default' : 'outline'}
                className={cn(
                  'mt-8 w-full font-mono text-xs uppercase tracking-wider',
                  tier.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-[0_4px_18px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.55)]'
                    : 'border-white/[0.1] bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white',
                )}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="snap-section relative z-10 px-6 py-28">
      <div className="mx-auto w-full">
        <div className="story-block mb-14 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">// FAQs</p>
          <h2 className="font-mono mt-5 text-4xl font-bold text-white md:text-5xl">Answers loaded.</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.q}
              whileInView={{ opacity: [0, 1] }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="story-block overflow-hidden rounded-xl border border-white/[0.08] bg-[#080c18]/80 transition-all hover:border-white/[0.12]"
            >
              <button
                type="button"
                onClick={() => setOpen(open === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="font-mono text-sm text-slate-200">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-300',
                    open === index && 'rotate-180',
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === index && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    <p className="border-t border-white/[0.06] px-6 py-4 font-mono text-[12px] leading-relaxed text-slate-400">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

export function CTASection({ onStart, reducedMotion }: { onStart: (prompt?: string) => void; reducedMotion: boolean }) {
  return (
    <section className="snap-section relative z-10 px-6 pb-28 pt-8">
      <div className="mx-auto w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_15%_25%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(ellipse_at_80%_75%,rgba(34,211,238,0.2),transparent_40%),linear-gradient(150deg,#0a0f20_0%,#050810_100%)] p-10 text-center md:p-18">
        {/* Top rule */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400"
        >
          // System Ready
        </motion.p>

        <motion.h2
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono mt-5 text-4xl font-bold leading-tight text-white md:text-6xl"
        >
          Build your next launch with
          <span className="block bg-gradient-to-r from-indigo-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent mt-1">
            a premium experience.
          </span>
        </motion.h2>

        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-sm text-slate-400"
        >
          Ship faster, look better, and tell your product story with world-class motion and interaction design.
        </motion.p>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex justify-center"
        >
          <Button
            onClick={() => onStart()}
            className="group relative h-12 gap-2 overflow-hidden rounded-none border border-cyan-400/50 bg-gradient-to-r from-indigo-600 to-cyan-500 px-10 font-mono text-sm uppercase tracking-wider text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
          >
            <motion.span
              animate={reducedMotion ? undefined : { scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 border border-indigo-400/30"
            />
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Initialize Your Build
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Bottom decoration */}
        <div className="mt-12 flex justify-center gap-8 opacity-30">
          {[Hexagon, CircuitBoard, BrainCircuit, Network, Database].map((Icon, i) => (
            <Icon key={i} className="h-5 w-5 text-slate-500" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function PremiumFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] px-6 py-12">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-[0_0_16px_rgba(99,102,241,0.5)]">
                <Hexagon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-white">
                CODER<span className="text-cyan-400">X</span>
              </p>
            </div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-slate-500">
              Neural-native product engineering platform.
              <br />
              Build faster. Look better.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Twitter, label: 'Twitter' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded border border-white/[0.08] bg-white/[0.03] text-slate-500 transition hover:border-white/[0.15] hover:text-slate-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-10 font-mono text-[11px]">
            <div>
              <p className="mb-3 uppercase tracking-[0.2em] text-slate-600">Product</p>
              <div className="flex flex-col gap-2.5 text-slate-500">
                {['Features', 'Demo', 'Pricing', 'Technology'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-slate-200">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 uppercase tracking-[0.2em] text-slate-600">Company</p>
              <div className="flex flex-col gap-2.5 text-slate-500">
                {['Home', 'Testimonials', 'FAQ'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-slate-200">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/[0.05] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] text-slate-600">
            © {new Date().getFullYear()} CoderX. All rights reserved.
          </p>
          <p className="font-mono text-[10px] text-slate-700">React · Three.js · GSAP · Framer Motion · TypeScript</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Section Dot Nav ──────────────────────────────────────────────────────────

export function SectionDotNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActive(id);
        },
        { threshold: 0.45 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  return (
    <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={`Go to ${label}`}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
          className={cn(
            'h-2 w-2 rounded-full border transition-all duration-300',
            active === id
              ? 'scale-125 border-cyan-400/90 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]'
              : 'border-white/25 bg-transparent hover:border-white/50',
          )}
        />
      ))}
    </div>
  );
}

// ─── Back to Top ──────────────────────────────────────────────────────────────

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 rounded border border-white/[0.1] bg-[#050810]/80 p-2.5 text-slate-400 shadow-[0_8px_24px_rgba(2,4,18,0.5)] backdrop-blur-xl transition hover:border-cyan-400/30 hover:text-cyan-300"
    >
      <ChevronDown className="h-4 w-4 rotate-180" />
    </button>
  );
}
