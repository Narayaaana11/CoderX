import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { sectionDots } from './LandingPage.data';
import {
  BackToTopButton,
  BuilderBlueprintsSection,
  CTASection,
  CapabilityMatrixSection,
  CursorGlow,
  FAQSection,
  FeaturesSection,
  GlowBackdrop,
  GridBackground,
  HeroSection,
  NoiseOverlay,
  PremiumFooter,
  PremiumNavbar,
  PricingSection,
  ProductDemoSection,
  ScanlineOverlay,
  SectionDotNav,
  ShowcaseSection,
  StatsSection,
  TechStackSection,
  TestimonialsSection,
  TrustStripSection,
  WorkflowSection,
} from './LandingPage.sections';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [ecoMode] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const activeSectionRef = useRef('hero');
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      if (!shouldReduceMotion && !ecoMode) {
        const storyBlocks = gsap.utils.toArray<HTMLElement>('.story-block');
        storyBlocks.forEach((block, index) => {
          gsap.fromTo(
            block,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              delay: Math.min(index * 0.04, 0.3),
              ease: 'power3.out',
              overwrite: 'auto',
              scrollTrigger: { trigger: block, start: 'top 88%', once: true },
            },
          );
        });
        gsap.to('.hero-orb', {
          y: 24,
          duration: 4.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, pageRef);
    return () => ctx.revert();
  }, [shouldReduceMotion, ecoMode]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionDots.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && activeSectionRef.current !== id) {
            activeSectionRef.current = id;
            setActiveSection(id);
          }
        },
        { threshold: 0.52 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    let rafId = 0;
    const updateProgress = () => {
      rafId = 0;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        scrollProgressRef.current = 0;
        setScrollProgress(0);
        return;
      }
      const next = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      if (Math.abs(next - scrollProgressRef.current) > 0.002) {
        scrollProgressRef.current = next;
        setScrollProgress(next);
      }
    };
    const scheduleUpdate = () => {
      if (!rafId) rafId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const startBuilding = (seedPrompt?: string) => {
    const prompt = (seedPrompt || '').trim();
    if (prompt) {
      navigate('/workspace', { state: { prompt } });
      return;
    }
    navigate('/workspace');
  };

  return (
    <div
      ref={pageRef}
      className={cn(
        'premium-page relative min-h-screen overflow-x-hidden bg-[#050810] text-slate-100',
        !shouldReduceMotion && 'premium-scroll-snap',
      )}
    >
      <CursorGlow enabled={!shouldReduceMotion && !ecoMode} />
      <GridBackground />
      <GlowBackdrop />
      <NoiseOverlay />
      <ScanlineOverlay />
      <PremiumNavbar onStart={startBuilding} activeSection={activeSection} scrollProgress={scrollProgress} />
      <HeroSection onStart={startBuilding} reducedMotion={shouldReduceMotion} ecoMode={ecoMode} />
      <TrustStripSection />
      <SectionDotNav sections={sectionDots} />
      <ShowcaseSection reducedMotion={shouldReduceMotion} ecoMode={ecoMode} />
      <FeaturesSection />
      <BuilderBlueprintsSection onStart={startBuilding} />
      <WorkflowSection />
      <ProductDemoSection />
      <CapabilityMatrixSection />
      <TechStackSection />
      <StatsSection reducedMotion={shouldReduceMotion} />
      <TestimonialsSection reducedMotion={shouldReduceMotion} />
      <PricingSection onStart={startBuilding} />
      <FAQSection />
      <CTASection onStart={startBuilding} reducedMotion={shouldReduceMotion} />
      <BackToTopButton />
      <PremiumFooter />
    </div>
  );
}
