"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Send,
  Layers,
  Loader2,
  ArrowUpRight,
  Zap,
  Binary,
  Globe2,
  Newspaper,
  AlertTriangle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/ui/footer";
import { ChatTurn } from "@/lib/types";
import Header from "@/components/ui/header";

// ── Constants ──────────────────────────────────────────────────────────────
const CHAT_STORAGE_KEY = "omnis_chat_history";

const getDynamicQuery = (label: string) => {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  const queries: Record<string, string> = {
    "Quantum Computing": `Latest breakthroughs in Quantum Computing as of ${month} ${year}`,
    "Global News": `Top 5 significant global news stories for ${month} ${year}`,
    "Blockchain Trends": `State of blockchain technology and crypto regulations in ${year}`,
    "AI Breakthroughs": `Most impactful AI research papers and model releases in ${month} ${year}`,
    "Space Exploration": `Upcoming space missions and astronomical events scheduled for ${year}`,
  };
  return queries[label] || label;
};

const SUGGESTIONS = [
  { label: "Quantum Computing", icon: <Zap size={15} />, category: "TECH" },
  { label: "Global News", icon: <Globe2 size={15} />, category: "CURRENT" },
  {
    label: "Blockchain Trends",
    icon: <Binary size={15} />,
    category: "FINANCE",
  },
  {
    label: "AI Breakthroughs",
    icon: <Layers size={15} />,
    category: "RESEARCH",
  },
  {
    label: "Space Exploration",
    icon: <Newspaper size={15} />,
    category: "SCIENCE",
  },
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01#@!%";

// ── Error parsing ──────────────────────────────────────────────────────────
function parseErrorContent(raw: string): { code?: string; message: string } {
  // Try to extract status code like "400 Bad Request" or "Tavily error: 404 ..."
  const codeMatch = raw.match(/\b(\d{3})\b/);
  const code = codeMatch?.[1];
  // Clean message: strip leading "error:" labels for display
  const message = raw.replace(/^(tavily\s+)?error:\s*/i, "").trim();
  return { code, message };
}

// ── ErrorBlock ─────────────────────────────────────────────────────────────
function ErrorBlock({ content }: { content: string }) {
  const { code, message } = parseErrorContent(content);

  // Glitch offset animation values
  const glitchLines = Array.from({ length: 6 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden"
      style={{
        border: "1px solid rgba(220,38,38,0.3)",
        background: "rgba(220,38,38,0.03)",
      }}
    >
      {/* Animated scan line */}
      <motion.div
        animate={{ y: ["-100%", "200%"] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1.8,
        }}
        className="absolute inset-x-0 h-px pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)",
        }}
      />

      {/* Corner brackets — TL */}
      <div
        className="absolute top-0 left-0 w-4 h-4 pointer-events-none"
        style={{
          borderTop: "1px solid rgba(220,38,38,0.7)",
          borderLeft: "1px solid rgba(220,38,38,0.7)",
        }}
      />
      {/* TR */}
      <div
        className="absolute top-0 right-0 w-4 h-4 pointer-events-none"
        style={{
          borderTop: "1px solid rgba(220,38,38,0.7)",
          borderRight: "1px solid rgba(220,38,38,0.7)",
        }}
      />
      {/* BL */}
      <div
        className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none"
        style={{
          borderBottom: "1px solid rgba(220,38,38,0.7)",
          borderLeft: "1px solid rgba(220,38,38,0.7)",
        }}
      />
      {/* BR */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none"
        style={{
          borderBottom: "1px solid rgba(220,38,38,0.7)",
          borderRight: "1px solid rgba(220,38,38,0.7)",
        }}
      />

      {/* Header row */}
      <div
        className="flex items-center gap-3 px-5 pt-5 pb-3"
        style={{ borderBottom: "1px solid rgba(220,38,38,0.12)" }}
      >
        {/* Pulsing alert icon */}
        <motion.div
          animate={{ opacity: [1, 0.3, 1], scale: [1, 0.9, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        >
          <AlertTriangle size={14} className="text-red-500" />
        </motion.div>

        {/* SYSTEM_ALERT label with glitch */}
        <GlitchText text="[ SYSTEM_ALERT ]" />

        {/* Status code badge */}
        {code && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="ml-auto text-[9px] font-black tabular-nums px-2 py-0.5"
            style={{
              background: "rgba(220,38,38,0.15)",
              border: "1px solid rgba(220,38,38,0.35)",
              color: "rgba(252,165,165,0.9)",
              letterSpacing: "0.15em",
            }}
          >
            ERR_{code}
          </motion.span>
        )}
      </div>

      {/* Message body */}
      <div className="px-5 py-4 relative">
        {/* Ghost glitch lines behind text */}
        {glitchLines.map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-5 right-5 h-px pointer-events-none"
            style={{
              top: `${20 + i * 14}%`,
              background: "rgba(220,38,38,0.04)",
            }}
            animate={{ scaleX: [1, 0.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}

        <RevealWords
          text={message}
          className="text-base md:text-lg font-medium leading-relaxed"
          style={{ color: "rgba(252,165,165,0.85)" }}
        />
      </div>

      {/* Bottom status strip */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="origin-left h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(220,38,38,0.7), rgba(220,38,38,0.1), transparent)",
        }}
      />
    </motion.div>
  );
}

// ── GlitchText ─────────────────────────────────────────────────────────────
function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    // Randomly trigger micro-glitch
    const t = setInterval(
      () => {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 120);
      },
      3200 + Math.random() * 2000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative inline-block">
      {/* Base */}
      <span
        className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500"
        style={{ textShadow: "0 0 18px rgba(220,38,38,0.6)" }}
      >
        {text}
      </span>
      {/* Glitch layer R */}
      <AnimatePresence>
        {glitching && (
          <motion.span
            key="gr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7, x: 2, skewX: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
            className="absolute inset-0 text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: "rgba(239,68,68,0.7)", mixBlendMode: "screen" }}
            aria-hidden
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
      {/* Glitch layer B */}
      <AnimatePresence>
        {glitching && (
          <motion.span
            key="gb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5, x: -2, skewX: -3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06, delay: 0.03 }}
            className="absolute inset-0 text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: "rgba(167,20,20,0.5)", mixBlendMode: "screen" }}
            aria-hidden
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── ClearHistoryButton ─────────────────────────────────────────────────────
function ClearHistoryButton({ onClear }: { onClear: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = () => {
    if (confirm) {
      onClear();
      setConfirm(false);
    } else {
      setConfirm(true);
      timerRef.current = setTimeout(() => setConfirm(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.35em] transition-all duration-200
        ${confirm ? "border border-orange-400 bg-orange-300/20 text-white" : "border border-[#ffffff10] bg-orange-600"} `}
      //   style={{
      //     border: confirm
      //       ? "1px solid rgba(220,38,38,0.5)"
      //       : "1px solid rgba(255,255,255,0.6)",
      //     background: confirm ? "rgba(220,38,38,0.08)" : "transparent",
      //     color: confirm ? "rgba(252,165,165,0.9)" : "rgba(82,82,91,0.9)",
      //   }}
      title="Clear chat history"
    >
      <AnimatePresence mode="wait">
        {confirm ? (
          <motion.span
            key="confirm"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            className="flex items-center gap-1.5 "
          >
            <motion.div
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            >
              <AlertTriangle size={10} />
            </motion.div>
            Confirm clear?
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="flex items-center gap-1.5 "
          >
            <Trash2
              size={10}
              className="group-hover:text-red-500 transition-colors"
            />
            Clear history
          </motion.span>
        )}
      </AnimatePresence>

      {/* Progress bar for auto-cancel */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            key="bar"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-0.5 origin-left z-10 bg-orange-500"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Home ───────────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // ── Hydrate from localStorage ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatTurn[];
        if (Array.isArray(parsed) && parsed.length > 0) setChat(parsed);
      }
    } catch {
      // corrupt storage — ignore
    }
    setHydrated(true);
  }, []);

  // ── Persist to localStorage whenever chat changes ──
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (chat.length === 0) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } else {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chat));
      }
    } catch {
      // storage full / blocked — ignore
    }
  }, [chat, hydrated]);

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat, loading]);

  const clearHistory = useCallback(() => {
    setChat([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      className="flex h-screen flex-col bg-[#040404] text-[#E5E5E5] overflow-hidden relative select-none"
      onMouseMove={onMouseMove}
      style={{
        fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
      }}
    >
      {/* ── Ambient orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, -60, 0], y: [0, -80, 50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(234,88,12,0.07) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ x: [0, -80, 60, 0], y: [0, 60, -80, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(251,146,60,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Mouse spotlight ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-none"
        style={{
          background: `radial-gradient(700px circle at ${mouse.x}px ${mouse.y}px, rgba(251,146,60,0.04), transparent 70%)`,
        }}
      />

      {/* ── Noise grain ── */}
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
        }}
      />

      {/* ── Grid ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <Header />

      {/* ══ MAIN ══ */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative z-20 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#f97316 transparent",
        }}
      >
        <div className="mx-auto max-w-4xl px-8 py-12">
          <AnimatePresence mode="wait">
            {/* ── HERO state ── */}
            {chat.length === 0 ? (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4 }}
                className="flex flex-col pt-6"
              >
                {/* Giant title */}
                <div className="relative mb-16 overflow-hidden pb-2">
                  <div
                    className="flex items-end gap-0 leading-none"
                    style={{
                      fontSize: "clamp(72px,13vw,148px)",
                      fontWeight: 900,
                      letterSpacing: "-0.06em",
                    }}
                  >
                    {"OMNIS".split("").map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 80 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.07,
                          duration: 0.7,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block text-white"
                        style={{
                          textShadow: `0 0 120px rgba(251,146,60,${0.08 + i * 0.02})`,
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                    <motion.span
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.65, duration: 0.5 }}
                      className="inline-block w-[0.08em] h-[0.85em] bg-orange-600 ml-2 mb-1 origin-bottom"
                      style={{ boxShadow: "0 0 20px rgba(234,88,12,0.8)" }}
                    />
                  </div>

                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{
                      delay: 0.55,
                      duration: 0.9,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="h-px bg-linear-to-r from-orange-600 via-orange-400/60 to-transparent origin-left mt-3"
                    style={{ boxShadow: "0 0 12px rgba(251,146,60,0.5)" }}
                  />

                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 font-bold mt-4"
                  >
                    Intelligence + Web Synthesis Engine
                  </motion.p>
                </div>

                {/* Suggestion grid */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.45,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-px"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {SUGGESTIONS.map((item, i) => (
                    <TiltCard
                      key={item.label}
                      onClick={() => setQuery(getDynamicQuery(item.label))}
                      className="group relative flex flex-col items-start p-7 bg-[#040404] text-left overflow-hidden cursor-pointer"
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(251,146,60,0.02) 50%, transparent 100%)",
                        }}
                      />
                      <div
                        className="absolute top-0 left-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(251,146,60,0.2) 0%, transparent 100%)",
                        }}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.55 + i * 0.08,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="text-orange-700 group-hover:text-orange-500 transition-colors duration-300 mb-5"
                      >
                        {item.icon}
                      </motion.div>

                      <span className="block text-[8px] uppercase tracking-[0.45em] text-zinc-700 group-hover:text-orange-600/60 transition-colors mb-2 font-bold">
                        {item.category}
                      </span>
                      <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors duration-200 leading-snug">
                        {item.label}
                      </span>

                      <motion.div
                        initial={{ opacity: 0, x: 6 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="absolute bottom-4 right-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <ArrowUpRight size={13} />
                      </motion.div>
                    </TiltCard>
                  ))}

                  {/* Status cell */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="p-7 bg-[#040404] flex flex-col justify-end"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                        className="w-[7px] h-3.5 bg-orange-600"
                        style={{ boxShadow: "0 0 12px rgba(234,88,12,0.7)" }}
                      />
                      <span className="text-[8px] text-zinc-700 uppercase tracking-[0.4em] font-bold">
                        Ready
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-800 italic">
                      Enter query to begin synthesis...
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              /* ── CHAT state ── */
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-20"
              >
                {/* ── Clear history bar ── */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between pb-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-orange-600"
                      style={{ boxShadow: "0 0 6px rgba(234,88,12,0.6)" }}
                    />
                    <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-700 font-bold">
                      {chat.filter(t => t.role === "user").length} session
                      {chat.filter(t => t.role === "user").length !== 1
                        ? "s"
                        : ""}{" "}
                      · stored locally
                    </span>
                  </div>
                  <ClearHistoryButton onClear={clearHistory} />
                </motion.div>

                {chat.map((turn, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {turn.role === "user" ? (
                      <div className="flex flex-col gap-3">
                        <span className="text-[8px] uppercase tracking-[0.45em] text-zinc-700 font-bold">
                          Input
                        </span>
                        <div
                          className="text-xl md:text-2xl font-black tracking-tight leading-tight text-zinc-500 pl-5"
                          style={{
                            borderLeft: "2px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {turn.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className="text-[8px] uppercase tracking-[0.4em] text-black font-black bg-orange-600 px-3 py-1"
                            style={{
                              boxShadow: "0 0 24px rgba(234,88,12,0.35)",
                            }}
                          >
                            Response
                          </span>
                          {turn.mode && (
                            <span
                              className="text-[8px] uppercase tracking-[0.35em] text-orange-500/50 px-2 py-1 font-bold"
                              style={{
                                border: "1px solid rgba(234,88,12,0.2)",
                              }}
                            >
                              {turn.mode}
                            </span>
                          )}
                          {turn.time !== undefined && turn.time > 0 && (
                            <span className="text-[9px] text-zinc-700 ml-auto tabular-nums">
                              {turn.time}ms
                            </span>
                          )}
                        </div>

                        {/* ── Content or ErrorBlock ── */}
                        {idx === chat.length - 1 ? (
                          turn.content.toLowerCase().includes("error") ? (
                            <ErrorBlock content={turn.content} />
                          ) : (
                            <div
                              className="text-lg md:text-xl whitespace-pre-wrap leading-[1.85] text-zinc-200 font-medium pl-5 py-1"
                              style={{
                                borderLeft: "1px solid rgba(234,88,12,0.25)",
                              }}
                            >
                              <RevealWords text={turn.content} />
                            </div>
                          )
                        ) : turn.content.toLowerCase().includes("error") ? (
                          <ErrorBlock content={turn.content} />
                        ) : (
                          <div
                            className="text-lg md:text-xl whitespace-pre-wrap leading-[1.85] text-zinc-200 font-medium pl-5 py-1"
                            style={{
                              borderLeft: "1px solid rgba(234,88,12,0.25)",
                            }}
                          >
                            {turn.content}
                          </div>
                        )}

                        {turn.sources && turn.sources.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="flex flex-wrap gap-2 pt-1"
                          >
                            {turn.sources.map((src, si) => (
                              <motion.div
                                key={si}
                                initial={{ opacity: 0, scale: 0.88, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                  delay: 0.4 + si * 0.07,
                                  type: "spring",
                                  stiffness: 200,
                                }}
                              >
                                <Link
                                  href={src}
                                  target="_blank"
                                  className="group flex items-center gap-2 px-3 py-1.5 text-[10px] transition-all duration-200 hover:text-orange-400"
                                  style={{
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(255,255,255,0.02)",
                                    backdropFilter: "blur(8px)",
                                  }}
                                  onMouseEnter={e =>
                                    (e.currentTarget.style.border =
                                      "1px solid rgba(234,88,12,0.4)")
                                  }
                                  onMouseLeave={e =>
                                    (e.currentTarget.style.border =
                                      "1px solid rgba(255,255,255,0.06)")
                                  }
                                >
                                  <span className="text-zinc-700 group-hover:text-orange-600 font-bold tabular-nums">
                                    {si + 1}
                                  </span>
                                  {new URL(src).hostname.replace("www.", "")}
                                  <ArrowUpRight
                                    size={10}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </Link>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading ── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="mt-14"
              >
                <div
                  className="pl-5 py-3"
                  style={{ borderLeft: "1px solid rgba(234,88,12,0.35)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2
                      size={13}
                      className="animate-spin text-orange-600"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-orange-600">
                      <ScrambleText text="Processing Logic Gate..." />
                    </span>
                  </div>
                  <div className="flex gap-1 items-end h-8">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scaleY: [0.15, 1, 0.15],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: i * 0.09,
                          ease: "easeInOut",
                        }}
                        className="w-5 h-full bg-orange-600/25 origin-bottom rounded-sm"
                        style={{ boxShadow: "0 0 6px rgba(234,88,12,0.15)" }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer
        queryState={{ query, setQuery }}
        chatState={{ chat, setChat }}
        loadingState={{ loading, setLoading }}
      />
    </div>
  );
}

// ── ScrambleText ────────────────────────────────────────────────────────────
function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let iter = 0;
    const iv = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, idx) => {
            if (char === " ") return " ";
            if (idx < iter) return text[idx];
            return SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          })
          .join(""),
      );
      if (iter >= text.length) clearInterval(iv);
      iter += 0.6;
    }, 28);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{display}</span>;
}

// ── RevealWords ─────────────────────────────────────────────────────────────
function RevealWords({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: i * 0.035,
            duration: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ── TiltCard ────────────────────────────────────────────────────────────────
function TiltCard({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 260,
    damping: 28,
  });

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
