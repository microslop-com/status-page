"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Menu,
  X,
  ExternalLink,
  ArrowUp,
  Activity,
  Clock,
  Server,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCcw,
  Trash2,
  Plus,
  ShieldAlert,
  Globe,
  Home as HomeIcon,
  Layers,
  AlertCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================
type ServiceStatus = "stable" | "degraded" | "down" | "pending";
type OverallStatus = "stable" | "degraded" | "down";

type CheckSource = "live" | "fallback";

interface Service {
  id: string;
  name: string;
  subtitle: string;
  status: ServiceStatus;
  icon: string;
  endpoint: string;
  rtt: number | null;
  checkSource: CheckSource;
  alwaysGreen?: boolean;
}

interface Incident {
  id: string;
  date: string;
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================
const DEFAULT_SERVICES: Service[] = [
  { id: "teams", name: "Microsoft Teams", subtitle: "The Void of Productivity", status: "stable", icon: "💬", endpoint: "https://teams.microsoft.com", rtt: null, checkSource: "fallback" },
  { id: "outlook", name: "Outlook", subtitle: "Loading Since 2019", status: "stable", icon: "📧", endpoint: "https://outlook.office365.com/owa/healthcheck.htm", rtt: null, checkSource: "fallback" },
  { id: "azure", name: "Azure Portal", subtitle: "Oopsie Dashboard", status: "stable", icon: "☁️", endpoint: "https://portal.azure.com", rtt: null, checkSource: "fallback" },
  { id: "onedrive", name: "OneDrive", subtitle: "Sync or Swim", status: "stable", icon: "☁️", endpoint: "https://onedrive.live.com", rtt: null, checkSource: "fallback" },
  { id: "copilot", name: "Copilot AI", subtitle: "Hallucination Engine", status: "stable", icon: "🤖", endpoint: "https://copilot.microsoft.com", rtt: null, checkSource: "fallback" },
  { id: "github", name: "GitHub", subtitle: "Acquired & Confused", status: "stable", icon: "🐙", endpoint: "https://github.com", rtt: null, checkSource: "fallback" },
  { id: "windows-update", name: "Windows Update", subtitle: "Restart Loop Simulator", status: "stable", icon: "🔄", endpoint: "https://www.microsoft.com/en-us/software-download/windows10", rtt: null, checkSource: "fallback" },
  { id: "billing", name: "Billing Systems", subtitle: "Always Operational 💰", status: "stable", icon: "💳", endpoint: "https://portal.office.com/billing", rtt: null, checkSource: "fallback", alwaysGreen: true },
];

const DEFAULT_INCIDENTS: Incident[] = [
  {
    id: "inc-1",
    date: "2026-04-05",
    severity: "critical",
    title: "Teams Goes Dark — Nobody Noticed",
    description: "Microsoft Teams experienced a complete outage lasting 4 hours. Productivity actually increased during the incident."
  },
  {
    id: "inc-2",
    date: "2026-04-02",
    severity: "high",
    title: "Outlook 'Loading...' Becomes Permanent Feature",
    description: "Users report the Outlook loading spinner has been spinning for 72 hours straight. Microsoft confirms it's 'by design'."
  },
  {
    id: "inc-3",
    date: "2026-03-28",
    severity: "high",
    title: "Azure Portal Shows Wrong Subscription Data",
    description: "Azure Portal displayed billing information from random other tenants. Engineers spent hours debugging their own configs before Microsoft acknowledged the issue."
  },
  {
    id: "inc-4",
    date: "2026-03-22",
    severity: "medium",
    title: "Copilot Starts Recommending Competitor Products",
    description: "Copilot in Edge began recommending Google Docs over Microsoft Word, citing 'superior collaboration features'. The incident lasted 2 hours."
  },
  {
    id: "inc-5",
    date: "2026-03-15",
    severity: "critical",
    title: "GitHub Actions Randomly Deletes Repositories",
    description: "A bug in GitHub Actions caused workflows to delete source repositories instead of build artifacts. Multiple open-source projects lost their main branches."
  },
];

// ============================================================================
// UPTIME DATA GENERATOR
// ============================================================================
function generateUptimeData(upPct: number): ("up" | "degraded" | "down")[] {
  const days = 90;
  const upDays = Math.round(days * upPct);
  const data: ("up" | "degraded" | "down")[] = [];
  for (let i = 0; i < days; i++) {
    if (i < upDays) data.push("up");
    else if (i < upDays + Math.round((days - upDays) * 0.6)) data.push("degraded");
    else data.push("down");
  }
  // Fisher-Yates shuffle for realism
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
}

const UPTIME_PCTS: Record<string, number> = {
  teams: 97.2,
  outlook: 98.5,
  azure: 99.1,
  onedrive: 98.8,
  copilot: 94.3,
  github: 99.6,
  "windows-update": 96.8,
  billing: 100.0,
};

// Pre-generate with a seeded shuffle (static across renders)
function seededUptimeData(upPct: number, seed: number): ("up" | "degraded" | "down")[] {
  const days = 90;
  const upDays = Math.round(days * upPct);
  const data: ("up" | "degraded" | "down")[] = [];
  for (let i = 0; i < days; i++) {
    if (i < upDays) data.push("up");
    else if (i < upDays + Math.round((days - upDays) * 0.6)) data.push("degraded");
    else data.push("down");
  }
  // Seeded shuffle using simple LCG
  let s = seed;
  for (let i = data.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
}

const UPTIME_DATA: Record<string, ("up" | "degraded" | "down")[]> = {};
Object.entries(UPTIME_PCTS).forEach(([id, pct], idx) => {
  UPTIME_DATA[id] = seededUptimeData(pct, 42 + idx * 7);
});

// ============================================================================
// ADMIN STORAGE
// ============================================================================
const ADMIN_INCIDENTS_KEY = "microslop_status_admin_incidents";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function loadAdminIncidents(): Incident[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_INCIDENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAdminIncidents(incidents: Incident[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_INCIDENTS_KEY, JSON.stringify(incidents));
  } catch {
    // silent fail
  }
}

function mergeIncidents(): Incident[] {
  const admin = loadAdminIncidents();
  const all = [...admin, ...DEFAULT_INCIDENTS];
  const seen = new Set<string>();
  return all.filter((inc) => {
    if (seen.has(inc.id)) return false;
    seen.add(inc.id);
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// HOOKS
// ============================================================================
function useScrollTop(threshold = 400) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = () => setShow(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return show;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ============================================================================
// STATUS CONFIG
// ============================================================================
const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  stable: { label: "NOMINAL", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  degraded: { label: "DEGRADED", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertCircle },
  down: { label: "CRASHED", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: X },
  pending: { label: "PENDING", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: Loader2 },
};

const OVERALL_CONFIG: Record<OverallStatus, { emoji: string; title: string; desc: string; color: string; pulse: string }> = {
  stable: { emoji: "✅", title: "All Systems Slop-Nominal", desc: "Microsoft's infrastructure is currently operational. Shocking, we know.", color: "text-emerald-400", pulse: "bg-emerald-500" },
  degraded: { emoji: "⚠️", title: "Partial Degradation Detected", desc: "Some services are responding slower than usual. Might be AI slop clogging the pipes.", color: "text-amber-400", pulse: "bg-amber-500" },
  down: { emoji: "🔥", title: "Infrastructure Fire", desc: "One or more services are unreachable. Microsoft engineers are probably restarting servers.", color: "text-red-400", pulse: "bg-red-500" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { label: "High", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  medium: { label: "Medium", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
};

// ============================================================================
// SCROLL TO TOP BUTTON
// ============================================================================
function ScrollToTop() {
  const show = useScrollTop();
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed right-4 bottom-20 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-white shadow-lg md:bottom-6 lg:hidden"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MOBILE BOTTOM NAV
// ============================================================================
function MobileBottomNav() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const sections = ["overview", "services", "incidents", "timeline"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "services", label: "Services", icon: Server },
    { id: "incidents", label: "Incidents", icon: AlertCircle },
    { id: "timeline", label: "Timeline", icon: History },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-border/40 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-colors",
                isActive ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "font-bold")} />
              <span className="text-[10px] font-semibold leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================================
// HEADER
// ============================================================================
function Header({
  overallStatus,
  isAdmin,
}: {
  overallStatus: OverallStatus;
  isAdmin: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "#overview", label: "Overview" },
    { href: "#services", label: "Services" },
    { href: "#incidents", label: "Incidents" },
    { href: "#timeline", label: "Timeline" },
  ];

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const oc = OVERALL_CONFIG[overallStatus];

  return (
    <header className="fixed top-0 right-0 left-0 z-[60] border-b border-border/40 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
        <button
          onClick={() => scrollTo("#overview")}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive sm:h-9 sm:w-9">
            <AlertTriangle className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <span className="text-base font-black tracking-widest sm:text-lg">
            MICROSLOP
          </span>
          <span className="text-base font-light tracking-widest text-muted-foreground sm:text-lg">
            STATUS
          </span>
        </button>

        {/* Overall status pill */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              oc.pulse
            )} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", oc.pulse)} />
          </span>
          <span className={cn("text-xs font-semibold", oc.color)}>
            {oc.title.split(" ").slice(0, 2).join(" ")}
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </button>
          ))}
          <a
            href="https://microslop.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <HomeIcon className="h-3.5 w-3.5" />
            Main Site
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="flex h-12 w-12 -mr-1 items-center justify-center rounded-lg active:bg-accent md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3 pb-6">
              {links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="flex h-12 items-center rounded-lg px-4 text-left text-sm font-medium text-muted-foreground transition-colors active:bg-accent active:text-foreground md:hidden"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="https://microslop.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors active:bg-accent md:hidden"
              >
                <HomeIcon className="h-3.5 w-3.5" />
                Main Site
                <ExternalLink className="h-3 w-3" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ============================================================================
// HERO BANNER — Overall Status
// ============================================================================
function HeroBanner({
  overallStatus,
  rtt,
  lastChecked,
  isChecking,
}: {
  overallStatus: OverallStatus;
  rtt: number;
  lastChecked: string;
  isChecking: boolean;
}) {
  const oc = OVERALL_CONFIG[overallStatus];

  return (
    <section id="overview" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/hero-bg.png"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8 lg:pt-28 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge
            variant="outline"
            className="mb-4 border-destructive/50 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm"
          >
            <Wifi className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-3.5 sm:w-3.5" />
            Infrastructure Monitor
          </Badge>

          <div className="mb-4 sm:mb-6">
            <motion.span
              key={overallStatus}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-5xl sm:text-7xl"
            >
              {oc.emoji}
            </motion.span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={overallStatus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className={cn("text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl", oc.color)}>
                {oc.title}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
                {oc.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 sm:mt-10 sm:max-w-lg sm:gap-4"
          >
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
                Avg Response Time
              </p>
              <p className="mt-1 font-mono text-xl font-black tabular-nums sm:text-2xl">
                {isChecking ? "..." : `${rtt}ms`}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
                Last Checked
              </p>
              <p className="mt-1 font-mono text-xl font-black tabular-nums sm:text-2xl">
                {lastChecked || "--:--"}
              </p>
            </div>
          </motion.div>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:mt-4 sm:text-xs">
            {isChecking ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Pinging {DEFAULT_SERVICES.length} Microsoft endpoints...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Auto-refreshes every 30 seconds
              </span>
            )}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// SERVICES GRID
// ============================================================================
function ServicesGrid({
  services,
  isAdmin,
  onStatusChange,
}: {
  services: Service[];
  isAdmin: boolean;
  onStatusChange: (id: string, status: ServiceStatus) => void;
}) {
  const statusOrder: ServiceStatus[] = ["stable", "degraded", "down", "pending"];

  return (
    <section id="services" className="border-t border-border/40 bg-muted/30 py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.div variants={fadeInUp} custom={0}>
            <Badge
              variant="secondary"
              className="mb-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest sm:mb-4 sm:text-xs"
            >
              <Layers className="mr-1.5 h-3 w-3" />
              Service Health
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            custom={1}
            className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl"
          >
            Infrastructure Services
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base"
          >
            Each service is pinged directly from your browser every 30 seconds. RTT values show real response times.
            {isAdmin && " Click a service to cycle its status."}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          variants={staggerContainer}
          className="mt-8 grid grid-cols-2 gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6"
        >
          {services.map((svc, i) => {
            const sc = STATUS_CONFIG[svc.status];
            return (
              <motion.div key={svc.id} variants={fadeInUp} custom={i}>
                <Card
                  className={cn(
                    "group h-full cursor-default border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300",
                    isAdmin && !svc.alwaysGreen && "cursor-pointer hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/5",
                    svc.status === "down" && "border-red-500/20",
                    svc.status === "degraded" && "border-amber-500/20"
                  )}
                  onClick={() => {
                    if (!isAdmin || svc.alwaysGreen) return;
                    const idx = statusOrder.indexOf(svc.status);
                    const next = statusOrder[(idx + 1) % statusOrder.length];
                    onStatusChange(svc.id, next);
                  }}
                >
                  <CardHeader className="space-y-2 pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl sm:text-3xl">{svc.icon}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 border text-[9px] font-bold uppercase tracking-wider sm:text-[10px]",
                          sc.border, sc.bg, sc.color
                        )}
                      >
                        {svc.status === "pending" && (
                          <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                        )}
                        {sc.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold sm:text-base">
                      {svc.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                      {svc.subtitle}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {svc.status === "pending" ? (
                        <span className="font-mono text-[10px] text-muted-foreground sm:text-xs">Probing...</span>
                      ) : svc.rtt !== null ? (
                        <span className={cn(
                          "font-mono text-[10px] font-bold tabular-nums sm:text-xs",
                          svc.rtt < 500 ? "text-emerald-400/80" : svc.rtt < 2000 ? "text-amber-400/80" : "text-red-400/80"
                        )}>
                          {svc.rtt}ms
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground sm:text-xs">—</span>
                      )}
                      {svc.checkSource === "live" && (
                        <Wifi className="h-2.5 w-2.5 text-emerald-400/60 sm:h-3 sm:w-3" />
                      )}
                      {svc.checkSource === "fallback" && svc.status !== "pending" && (
                        <WifiOff className="h-2.5 w-2.5 text-zinc-500/60 sm:h-3 sm:w-3" />
                      )}
                    </div>
                    {svc.alwaysGreen && (
                      <p className="mt-1.5 text-[10px] font-semibold text-emerald-500/70">
                        * Billing never goes down
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// UPTIME SECTION — 90-Day History
// ============================================================================
function UptimeSection() {
  return (
    <section id="timeline" className="border-t border-border/40 py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.div variants={fadeInUp} custom={0}>
            <Badge
              variant="secondary"
              className="mb-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest sm:mb-4 sm:text-xs"
            >
              <History className="mr-1.5 h-3 w-3" />
              Historical Data
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            custom={1}
            className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl"
          >
            90-Day Slop History
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base"
          >
            Each square represents one day. Green = operational, yellow = degraded, red = outage.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          variants={staggerContainer}
          className="mt-8 space-y-2 sm:mt-16 sm:space-y-3"
        >
          {DEFAULT_SERVICES.map((svc, i) => {
            const data = UPTIME_DATA[svc.id] || [];
            const pct = UPTIME_PCTS[svc.id] || 99.9;
            const upCount = data.filter((d) => d === "up").length;
            const actualPct = data.length > 0 ? ((upCount / data.length) * 100).toFixed(2) : "100.00";

            return (
              <motion.div key={svc.id} variants={fadeInUp} custom={i}>
                <Card className="border-border/50 bg-card/60 transition-all duration-300 hover:bg-card/80">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:w-40">
                        <span className="text-lg sm:text-xl">{svc.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold sm:text-sm">{svc.name}</p>
                          <p className={cn(
                            "font-mono text-[11px] font-bold tabular-nums sm:text-xs",
                            pct >= 99.5 ? "text-emerald-400" : pct >= 97 ? "text-amber-400" : "text-red-400"
                          )}>
                            {actualPct}%
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-[2px] sm:gap-[3px]">
                        {data.map((day, idx) => (
                          <div
                            key={idx}
                            title={`Day ${90 - idx}: ${day === "up" ? "Operational" : day === "degraded" ? "Degraded" : "Down"}`}
                            className={cn(
                              "h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3",
                              day === "up" && "bg-emerald-500/80",
                              day === "degraded" && "bg-amber-500/80",
                              day === "down" && "bg-red-500/80"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// INCIDENT TIMELINE
// ============================================================================
function IncidentTimeline({
  incidents,
  isAdmin,
  onDelete,
}: {
  incidents: Incident[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <section id="incidents" className="border-t border-border/40 bg-muted/30 py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.div variants={fadeInUp} custom={0}>
            <Badge
              variant="secondary"
              className="mb-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest sm:mb-4 sm:text-xs"
            >
              <AlertCircle className="mr-1.5 h-3 w-3" />
              Incident Log
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            custom={1}
            className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl"
          >
            Recent Incidents
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base"
          >
            Documented infrastructure failures and their spectacularly creative resolutions.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          variants={staggerContainer}
          className="mt-8 sm:mt-16"
        >
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute top-0 bottom-0 left-4 w-px bg-border/60 sm:left-6" />

            <div className="space-y-4 sm:space-y-6">
              {incidents.map((inc, i) => {
                const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.medium;
                return (
                  <motion.div key={inc.id} variants={fadeInUp} custom={i} className="relative pl-10 sm:pl-14">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute top-4 left-2.5 h-3 w-3 rounded-full ring-4 ring-background sm:left-4.5 sm:h-3.5 sm:w-3.5 sm:top-5",
                      inc.severity === "critical" ? "bg-red-500" : inc.severity === "high" ? "bg-amber-500" : "bg-orange-500"
                    )} />

                    <Card className="border-border/50 bg-card/60 transition-all duration-300 hover:border-border hover:bg-card/80">
                      <CardContent className="p-4 sm:p-5 lg:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-muted-foreground sm:text-xs">
                              {inc.date}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border text-[9px] font-bold uppercase tracking-wider sm:text-[10px]",
                                sev.border, sev.bg, sev.color
                              )}
                            >
                              {sev.label}
                            </Badge>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold leading-snug sm:text-base">
                              {inc.title}
                            </h3>
                            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-sm">
                              {inc.description}
                            </p>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => onDelete(inc.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Delete incident"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// ADD INCIDENT FORM (Admin Only)
// ============================================================================
function AddIncidentForm({ onAdd, onCancel }: { onAdd: (inc: Incident) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"critical" | "high" | "medium">("high");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onAdd({
      id: generateId(),
      date,
      severity,
      title: title.trim(),
      description: description.trim(),
    });

    setTitle("");
    setDescription("");
    setSeverity("high");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <Card className="mx-auto mt-6 max-w-2xl border-destructive/20 sm:mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="h-5 w-5 text-destructive" />
            Add New Incident
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inc-title" className="text-sm">Title *</Label>
              <Input
                id="inc-title"
                placeholder="Brief incident title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc-desc" className="text-sm">Description *</Label>
              <Textarea
                id="inc-desc"
                placeholder="What happened?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as "critical" | "high" | "medium")}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inc-date" className="text-sm">Date</Label>
                <Input
                  id="inc-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                Add Incident
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// COMMUNITY SMOKE SIGNALS
// ============================================================================
function CommunitySection() {
  const links = [
    {
      title: "Reddit r/sysadmin",
      description: "Where real admins rage about Microsoft outages",
      url: "https://www.reddit.com/r/sysadmin/",
      icon: Globe,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      hoverBorder: "hover:border-orange-500/40",
    },
    {
      title: "Downdetector",
      description: "Microsoft 365 outage reports from actual users",
      url: "https://downdetector.com/status/microsoft-365/",
      icon: Activity,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      hoverBorder: "hover:border-red-500/40",
    },
    {
      title: "X / Twitter",
      description: "#MicrosoftDown hashtag — the modern town square",
      url: "https://twitter.com/search?q=%23MicrosoftDown",
      icon: Globe,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hoverBorder: "hover:border-blue-500/40",
    },
  ];

  return (
    <section className="border-t border-border/40 py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.div variants={fadeInUp} custom={0}>
            <Badge
              variant="secondary"
              className="mb-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest sm:mb-4 sm:text-xs"
            >
              <Globe className="mr-1.5 h-3 w-3" />
              External
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            custom={1}
            className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl"
          >
            Community Smoke Signals
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base"
          >
            When Microsoft&apos;s own status page lies, the community speaks truth.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          variants={staggerContainer}
          className="mt-8 grid gap-4 sm:mt-16 sm:grid-cols-3 sm:gap-6"
        >
          {links.map((link, i) => (
            <motion.div key={link.title} variants={fadeInUp} custom={i}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block h-full rounded-xl border bg-card/80 backdrop-blur-sm p-5 transition-all duration-300 sm:p-6",
                  link.border, link.hoverBorder
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", link.bg)}>
                  <link.icon className={cn("h-5 w-5", link.color)} />
                </div>
                <h3 className={cn("mt-3 text-base font-bold", link.color)}>{link.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  {link.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  Visit <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ lastChecked }: { lastChecked: string }) {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-8 pb-24 sm:pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-black tracking-widest">MICROSLOP STATUS</span>
          </div>

          <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
            This is a satirical status page. We do not represent Microsoft Corporation.
            Health checks ping actual Microsoft endpoints but all commentary is fictional.
            No services were harmed in the making of this page (Microsoft did that themselves).
          </p>

          <Separator className="max-w-xs bg-border/50" />

          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Last Slop-Check: {lastChecked || "Pending..."}
            </p>
            <a
              href="https://microslop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to microslop.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function StatusPage() {
  const { toast } = useToast();

  // --- State ---
  const [overallStatus, setOverallStatus] = useState<OverallStatus>("stable");
  const [rtt, setRtt] = useState(0);
  const [lastChecked, setLastChecked] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>(DEFAULT_INCIDENTS);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [showAddIncident, setShowAddIncident] = useState(false);

  // --- Health Check (multi-endpoint, parallel) ---
  const checkSlop = useCallback(async () => {
    setIsChecking(true);

    // Set all services to "pending" first
    setServices(prev => prev.map(s => s.alwaysGreen ? s : { ...s, status: "pending" as ServiceStatus }));

    // Ping each service endpoint in parallel
    const results = await Promise.allSettled(
      DEFAULT_SERVICES.map(async (svc) => {
        if (svc.alwaysGreen) {
          return { id: svc.id, rtt: 0, reachable: true };
        }
        try {
          const start = Date.now();
          await fetch(svc.endpoint, {
            mode: "no-cors",
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          });
          const rtt = Date.now() - start;
          return { id: svc.id, rtt, reachable: true };
        } catch {
          return { id: svc.id, rtt: 0, reachable: false };
        }
      })
    );

    // Calculate average RTT from successful pings
    let totalRtt = 0;
    let reachableCount = 0;
    let anyDown = false;

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.reachable) {
        totalRtt += r.value.rtt;
        reachableCount++;
      } else {
        anyDown = true;
      }
    });

    const avgRtt = reachableCount > 0 ? Math.round(totalRtt / reachableCount) : 9999;
    setRtt(avgRtt);

    // Determine overall status
    if (anyDown) {
      setOverallStatus("down");
    } else if (avgRtt > 2000) {
      setOverallStatus("degraded");
    } else {
      setOverallStatus("stable");
    }

    // Update each service with real results
    setServices(prev => prev.map(svc => {
      if (svc.alwaysGreen) {
        return { ...svc, status: "stable" as ServiceStatus, rtt: 0, checkSource: "fallback" as CheckSource };
      }
      const result = results.find(r => r.status === "fulfilled" && r.value.id === svc.id);
      if (!result || result.status !== "fulfilled") {
        return { ...svc, status: "down" as ServiceStatus, rtt: null, checkSource: "fallback" as CheckSource };
      }
      const { rtt, reachable } = result.value;
      if (!reachable) {
        return { ...svc, status: "down" as ServiceStatus, rtt: null, checkSource: "live" as CheckSource };
      }
      if (rtt > 3000) {
        return { ...svc, status: "down" as ServiceStatus, rtt, checkSource: "live" as CheckSource };
      }
      if (rtt > 1500) {
        return { ...svc, status: "degraded" as ServiceStatus, rtt, checkSource: "live" as CheckSource };
      }
      return { ...svc, status: "stable" as ServiceStatus, rtt, checkSource: "live" as CheckSource };
    }));

    setLastChecked(new Date().toLocaleTimeString());
    setIsChecking(false);
  }, []);

  // Run health check on mount and every 30 seconds
  useEffect(() => {
    checkSlop();
    const interval = setInterval(checkSlop, 30000);
    return () => clearInterval(interval);
  }, [checkSlop]);

  // --- Merge admin incidents on mount ---
  useEffect(() => {
    setIncidents(mergeIncidents());
  }, []);

  // --- Admin toggle (Ctrl+Shift+A) ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setIsAdmin((prev) => {
          const next = !prev;
          if (next) {
            toast({
              title: "Admin mode activated",
              description: "Click services to change status. Add or delete incidents.",
            });
          } else {
            setShowAddIncident(false);
            toast({ title: "Admin mode deactivated" });
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toast]);

  // --- Service status change (admin) ---
  const handleServiceStatusChange = useCallback((id: string, status: ServiceStatus) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    const sc = STATUS_CONFIG[status];
    toast({
      title: `Service updated`,
      description: `Status changed to ${sc.label}`,
    });
  }, [toast]);

  // --- Delete incident (admin) ---
  const handleDeleteIncident = useCallback((id: string) => {
    const admin = loadAdminIncidents();
    const filtered = admin.filter((inc) => inc.id !== id);
    saveAdminIncidents(filtered);
    setIncidents(mergeIncidents());
    toast({ title: "Incident deleted" });
  }, [toast]);

  // --- Add incident (admin) ---
  const handleAddIncident = useCallback((inc: Incident) => {
    const admin = loadAdminIncidents();
    const updated = [inc, ...admin];
    saveAdminIncidents(updated);
    setIncidents(mergeIncidents());
    setShowAddIncident(false);
    toast({ title: "Incident added" });
  }, [toast]);

  return (
    <div className="min-h-screen">
      <Header overallStatus={overallStatus} isAdmin={isAdmin} />
      {/* Spacer for fixed header */}
      <div className="h-[52px] sm:h-[56px]" />
      <HeroBanner
        overallStatus={overallStatus}
        rtt={rtt}
        lastChecked={lastChecked}
        isChecking={isChecking}
      />

      {isAdmin && (
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <Badge variant="outline" className="border-destructive/50 bg-destructive/5 text-destructive">
            <ShieldAlert className="mr-1 h-3 w-3" />
            Admin Mode Active
          </Badge>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddIncident(!showAddIncident)}
              size="sm"
              className="gap-1.5"
            >
              {showAddIncident ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showAddIncident ? "Cancel" : "Add Incident"}
            </Button>
            <Button
              onClick={checkSlop}
              size="sm"
              variant="outline"
              className="gap-1.5"
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
              Force Check
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddIncident && isAdmin && (
          <AddIncidentForm
            onAdd={handleAddIncident}
            onCancel={() => setShowAddIncident(false)}
          />
        )}
      </AnimatePresence>

      <ServicesGrid
        services={services}
        isAdmin={isAdmin}
        onStatusChange={handleServiceStatusChange}
      />
      <UptimeSection />
      <IncidentTimeline
        incidents={incidents}
        isAdmin={isAdmin}
        onDelete={handleDeleteIncident}
      />
      <CommunitySection />
      <Footer lastChecked={lastChecked} />
      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
      <ScrollToTop />
      <MobileBottomNav />
    </div>
  );
}
