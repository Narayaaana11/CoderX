import { type ComponentType } from "react";
import {
  Activity,
  Binary,
  BrainCircuit,
  CircuitBoard,
  Cloud,
  Code2,
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  Network,
  Radio,
  Rocket,
  Sparkles,
  Zap,
} from "lucide-react";

export interface FeatureItem {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  iconColor: string;
  tag: string;
}

export interface TechItem {
  name: string;
  label: string;
  color: string;
  icon: ComponentType<{ className?: string }>;
}

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  avatar: string;
  stars: number;
}

export type SegmentKey = "founder" | "pm" | "developer";

export interface QuickPromptItem {
  label: string;
  prompt: string;
}

export interface SegmentProfile {
  label: string;
  description: string;
  rotatingPhrases: string[];
  quickPrompts: QuickPromptItem[];
  metrics: Array<{ value: string; label: string }>;
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

export interface StarterBlueprint {
  title: string;
  description: string;
  prompt: string;
  tags: string[];
  icon: ComponentType<{ className?: string }>;
}

export const navLinks = [
  { label: "Showcase", href: "#showcase" },
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Stack", href: "#stack" },
  { label: "Testimonials", href: "#testimonials" },
];

export const trustSignals = [
  "Neural Orchestration",
  "Zero-Trust Runtime",
  "Edge-Native Deployment",
  "Realtime Build Graph",
  "Multimodal AI Engine",
  "Quantum-Safe Security",
  "Adaptive Inference",
  "Self-Healing Architecture",
];

export const segmentProfiles: Record<SegmentKey, SegmentProfile> = {
  founder: {
    label: "Founder",
    description:
      "Launch fast with opinionated product scaffolds, conversion-ready UX, and deployment flow built in from day one.",
    rotatingPhrases: [
      "launch-ready SaaS products.",
      "MVPs investors can touch.",
      "growth loops in one sprint.",
    ],
    quickPrompts: [
      { label: "Startup SaaS MVP", prompt: "Build a startup SaaS MVP with onboarding, billing, analytics dashboard, and production deployment flow." },
      { label: "Waitlist + Launch Site", prompt: "Create a high-conversion launch website with waitlist capture, testimonials, FAQ, and pricing sections." },
      { label: "Investor Demo App", prompt: "Generate an investor demo product with polished UI, realistic sample data, and guided product tour." },
      { label: "Marketplace MVP", prompt: "Create a marketplace MVP with catalog, seller onboarding, cart, checkout, and order tracking." },
    ],
    metrics: [
      { value: "6x", label: "Faster MVP Iteration" },
      { value: "14d", label: "Typical First Launch" },
      { value: "92%", label: "Spec-to-Build Accuracy" },
    ],
  },
  pm: {
    label: "PM",
    description:
      "Translate product specs into working flows, validate UX quickly, and iterate with full context across the team.",
    rotatingPhrases: [
      "roadmaps into real software.",
      "PRDs into working flows.",
      "features users actually adopt.",
    ],
    quickPrompts: [
      { label: "Admin + Ops Console", prompt: "Build an operations console with roles, approvals, task queues, filters, and exportable reporting." },
      { label: "Customer Support Copilot", prompt: "Create a support workspace with ticket routing, SLA status, AI response drafts, and team inbox management." },
      { label: "Usage Analytics Hub", prompt: "Generate a product analytics hub with KPI cards, trend charts, cohort filters, and funnel insights." },
      { label: "Onboarding Optimizer", prompt: "Build an onboarding flow with checklist progression, nudges, completion analytics, and segmentation controls." },
    ],
    metrics: [
      { value: "58%", label: "Faster Spec Validation" },
      { value: "3x", label: "More Weekly Experiments" },
      { value: "41%", label: "Less Handoff Friction" },
    ],
  },
  developer: {
    label: "Developer",
    description:
      "Ship full-stack features with generated scaffolding, live preview loops, and less repetitive boilerplate work.",
    rotatingPhrases: [
      "internal tools teams love.",
      "AI copilots that convert.",
      "features without boilerplate drag.",
    ],
    quickPrompts: [
      { label: "Full-Stack Starter", prompt: "Scaffold a full-stack app with React frontend, Node backend, auth, API routes, and environment-aware config." },
      { label: "Developer Portal", prompt: "Build a developer portal with docs search, API key management, usage quotas, and audit logs." },
      { label: "AI Workflow Studio", prompt: "Create an AI workflow studio with prompt templates, model settings, streaming output, and run history." },
      { label: "Internal Automation Tool", prompt: "Generate an internal automation tool with workflow builder, cron schedules, logs, and alerting." },
    ],
    metrics: [
      { value: "72%", label: "Less Boilerplate" },
      { value: "4x", label: "Faster Feature Scaffolding" },
      { value: "99.9%", label: "Preview Uptime" },
    ],
  },
};

export const featureCards: FeatureItem[] = [
  {
    title: "Neural Orchestration",
    description: "Multi-agent planning coordinates architecture, generation, and refinement in one fluid workflow.",
    icon: BrainCircuit,
    accent: "from-violet-500/25 via-indigo-500/12 to-transparent",
    iconColor: "text-violet-300",
    tag: "CORE ENGINE",
  },
  {
    title: "Realtime Build Graph",
    description: "Visualize every stage from prompt to preview with transparent progress and instant edits.",
    icon: Activity,
    accent: "from-cyan-500/25 via-sky-500/12 to-transparent",
    iconColor: "text-cyan-300",
    tag: "VISUALIZATION",
  },
  {
    title: "Secure Runtime",
    description: "Sandboxed execution and strict policy controls give enterprise-grade confidence without friction.",
    icon: Lock,
    accent: "from-emerald-500/25 via-teal-500/12 to-transparent",
    iconColor: "text-emerald-300",
    tag: "SECURITY",
  },
  {
    title: "Edge Deployment",
    description: "Ship globally in minutes with optimized bundles, immutable releases, and integrated observability.",
    icon: Radio,
    accent: "from-orange-500/25 via-amber-500/12 to-transparent",
    iconColor: "text-orange-300",
    tag: "INFRASTRUCTURE",
  },
];

export const techStack: TechItem[] = [
  { name: "React", label: "UI Runtime", color: "text-cyan-300 border-cyan-400/25 bg-cyan-500/10", icon: Globe },
  { name: "Node.js", label: "Backend Core", color: "text-green-300 border-green-400/25 bg-green-500/10", icon: Cpu },
  { name: "AI Models", label: "Model Layer", color: "text-violet-300 border-violet-400/25 bg-violet-500/10", icon: BrainCircuit },
  { name: "Cloud", label: "Infra", color: "text-sky-300 border-sky-400/25 bg-sky-500/10", icon: Cloud },
  { name: "Three.js", label: "3D Engine", color: "text-orange-300 border-orange-400/25 bg-orange-500/10", icon: Layers },
  { name: "GSAP", label: "Motion", color: "text-yellow-300 border-yellow-400/25 bg-yellow-500/10", icon: Zap },
  { name: "WebGL", label: "Rendering", color: "text-rose-300 border-rose-400/25 bg-rose-500/10", icon: CircuitBoard },
  { name: "TypeScript", label: "Safety", color: "text-blue-300 border-blue-400/25 bg-blue-500/10", icon: Binary },
];

export const testimonials: TestimonialItem[] = [
  { name: "Lena Park", role: "Founder, Driftline", quote: "CoderX gave us six weeks of product velocity in six days. The interaction quality feels truly premium.", avatar: "LP", stars: 5 },
  { name: "Marcus Ibarra", role: "Head of Product, NovaOps", quote: "The 3D storytelling and fluid transitions changed our conversion rate immediately. It feels like a top-tier launch site.", avatar: "MI", stars: 5 },
  { name: "Aisha Rahman", role: "Design Lead, Byteforge", quote: "This is the rare platform where engineering and brand experience both feel first-class. We shipped faster and looked better.", avatar: "AR", stars: 5 },
];

export const starterBlueprints: StarterBlueprint[] = [
  {
    title: "SaaS Admin Platform",
    description: "Scaffold a multi-role dashboard with auth, billing, analytics, and tenant management.",
    prompt: "Build a production-ready SaaS admin platform with role-based auth, Stripe billing, dashboard analytics, team management, and responsive UI.",
    tags: ["RBAC", "Billing", "Analytics"],
    icon: Database,
  },
  {
    title: "AI Support Copilot",
    description: "Launch an AI ticket assistant with conversation history, escalation flow, and operator tools.",
    prompt: "Create an AI support copilot web app with conversation inbox, ticket status, escalation routing, FAQ retrieval, and admin moderation tools.",
    tags: ["AI Chat", "Inbox", "Escalations"],
    icon: BrainCircuit,
  },
  {
    title: "Marketplace MVP",
    description: "Generate listings, checkout, seller dashboard, and order tracking for rapid launch.",
    prompt: "Generate a modern marketplace MVP with product listings, category filters, cart, checkout, seller dashboard, and order tracking.",
    tags: ["E-commerce", "Payments", "Ops"],
    icon: Network,
  },
];

export const stats = [
  { value: 12400, suffix: "+", label: "Apps Built" },
  { value: 97, suffix: "%", label: "Build Success Rate" },
  { value: 4.9, suffix: "/5", label: "User Rating", decimal: true },
  { value: 180, suffix: "s", label: "Avg. First Build" },
];

export const sectionDots = [
  { id: "hero", label: "Hero" },
  { id: "showcase", label: "Showcase" },
  { id: "features", label: "Features" },
  { id: "demo", label: "Demo" },
  { id: "stack", label: "Stack" },
  { id: "stats", label: "Stats" },
  { id: "testimonials", label: "Testimonials" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Explore and prototype.",
    features: ["AI chat interface", "Live code editor", "Instant preview", "Ollama / local models", "3 concurrent projects"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "For serious product builders.",
    features: ["Everything in Free", "All LLM providers", "GitHub sync", "One-click deploy", "Unlimited projects", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams and organizations.",
    features: ["Everything in Pro", "Self-hosted option", "Custom agent pipeline", "SSO / SAML", "SLA guarantee", "Dedicated support"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export const faqs = [
  { q: "What LLM providers are supported?", a: "CoderX supports OpenAI (GPT-4o), Anthropic (Claude), Google (Gemini), DeepSeek, and Ollama for fully local, offline-capable models. Switch at any time in Settings." },
  { q: "Can I run CoderX completely offline?", a: "Yes. Pair Ollama for local inference with Docker for the sandbox runtime and nothing leaves your machine. No cloud keys required." },
  { q: "Is CoderX open source?", a: "CoderX is MIT licensed. Fork it, self-host it, and contribute back whenever you want." },
  { q: "What kind of apps can I build?", a: "Any modern web application - React frontends, Node.js backends, SaaS dashboards, e-commerce stores, blog platforms, and more. CoderX generates complete full-stack codebases." },
  { q: "How does the sandbox work?", a: "Generated code runs in an isolated E2B cloud sandbox or a local Docker container. You get live terminal access, hot-reload preview, and zero risk to your local environment." },
];

export const workflowSteps = [
  { title: "Describe Product Intent", detail: "Start with natural language and let CoderX derive architecture, routes, components, and data flow.", icon: Sparkles, num: "01" },
  { title: "Review + Refine Fast", detail: "Inspect generated files, request edits in chat, and validate behavior in live preview instantly.", icon: Code2, num: "02" },
  { title: "Ship with Confidence", detail: "Run deployment checks, environment validation, and publish to cloud with a clean handoff.", icon: Rocket, num: "03" },
];

export const capabilityRows = [
  { area: "Frontend", supports: "React UI scaffolding, component updates, responsive layout generation" },
  { area: "Backend", supports: "Node service scaffolds, API wiring, runtime integration patterns" },
  { area: "AI Engines", supports: "Provider-agnostic orchestration with pluggable adapter workflows" },
  { area: "Validation", supports: "Build checks, telemetry surfaces, and iterative prompt-driven refinement" },
  { area: "Delivery", supports: "Preview-first workflow and deployment-ready project outputs" },
];
