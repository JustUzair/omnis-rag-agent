"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
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
} from "lucide-react";
import { API_URL } from "@/lib/config";
import Link from "next/link";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  mode?: "web" | "direct";
  time?: number;
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

function RevealWords({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, loading]);

  async function runSearch(prompt: string) {
    setLoading(true);
    setChat(prev => [...prev, { role: "user", content: prompt }]);
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/v1/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Search failed");
      setChat(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          mode: data.mode,
          time: Math.round(performance.now() - t0),
        },
      ]);
    } catch (err: any) {
      setChat(prev => [
        ...prev,
        {
          role: "assistant",
          content: "System Fault. Request Terminated.",
          sources: [],
          time: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    const p = query.trim();
    setQuery("");
    runSearch(p);
  };

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

      {/* ══ HEADER ══ */}
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 bg-[#040404]/80 backdrop-blur-2xl"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 90, scale: 1.05 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center bg-orange-600 rounded-sm"
            style={{
              boxShadow:
                "0 0 24px rgba(234,88,12,0.45), 0 0 80px rgba(234,88,12,0.1)",
            }}
          >
            <Layers size={17} className="text-black" />
          </motion.div>
          <div>
            <div
              className="text-xl font-black tracking-[-0.06em] text-white leading-none"
              style={{ textShadow: "0 0 40px rgba(251,146,60,0.18)" }}
            >
              OMNIS
            </div>
            <div className="text-[8px] uppercase tracking-[0.45em] text-orange-500/80 font-bold mt-0.5">
              Search Agent
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            style={{ boxShadow: "0 0 8px rgba(16,185,129,0.9)" }}
          />
          <span className="text-[10px] text-emerald-500/80 font-bold tracking-[0.3em] uppercase hidden md:block">
            Operational
          </span>
        </div>
      </motion.header>

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
                    className="h-px bg-gradient-to-r from-orange-600 via-orange-400/60 to-transparent origin-left mt-3"
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
                      onClick={() => setQuery(item.label)}
                      className="group relative flex flex-col items-start p-7 bg-[#040404] text-left overflow-hidden cursor-pointer"
                    >
                      {/* Hover shimmer */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(251,146,60,0.02) 50%, transparent 100%)",
                        }}
                      />
                      {/* Corner accent */}
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
                        style={{
                          filter: "drop-shadow(0 0 6px rgba(251,146,60,0))",
                          transition: "all 0.3s",
                        }}
                      >
                        <span className="group-hover:[filter:drop-shadow(0_0_8px_rgba(251,146,60,0.5))] transition-all duration-300">
                          {item.icon}
                        </span>
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
                        className="w-[7px] h-[14px] bg-orange-600"
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
                          className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-zinc-500 pl-5"
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

                        <div
                          className="text-lg md:text-xl leading-[1.85] text-zinc-200 font-medium pl-5 py-1"
                          style={{
                            borderLeft: "1px solid rgba(234,88,12,0.25)",
                          }}
                        >
                          {idx === chat.length - 1 ? (
                            <RevealWords text={turn.content} />
                          ) : (
                            turn.content
                          )}
                        </div>

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

      {/* ══ FOOTER / INPUT ══ */}
      <motion.footer
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 bg-[#040404]/90 backdrop-blur-2xl p-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="group relative">
            {/* Animated glow border */}
            <div
              className="absolute -inset-[1px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(234,88,12,0.7), rgba(251,146,60,0.2), rgba(234,88,12,0.7))",
                backgroundSize: "200% 100%",
                animation: "shimmerBorder 2.5s ease infinite",
              }}
            />
            <div
              className="relative flex items-center bg-[#080808] group-focus-within:bg-[#0A0808]"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "background 0.3s",
              }}
            >
              <span className="pl-5 text-sm font-black text-orange-700 group-focus-within:text-orange-500 transition-colors select-none">
                {">"}_
              </span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="AWAITING QUERY..."
                className="flex-1 bg-transparent text-white text-sm uppercase tracking-widest placeholder:text-zinc-800 outline-none h-14 px-4 disabled:cursor-not-allowed"
                disabled={loading}
                style={{ fontFamily: "inherit" }}
              />
              <motion.button
                type="submit"
                disabled={loading || query.trim().length < 2}
                whileHover={{ backgroundColor: "rgb(249,115,22)" }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 h-14 px-8 bg-orange-600 text-black font-black text-[10px] uppercase tracking-[0.3em] disabled:opacity-20 transition-colors"
                style={{ boxShadow: "0 0 32px rgba(234,88,12,0.28)" }}
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    Execute <Send size={12} />
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <div className="mt-3 flex gap-6 text-[8px] font-bold tracking-[0.3em] uppercase text-zinc-800 px-1">
            <span className="tabular-nums">
              LAT: {chat[chat.length - 1]?.time ?? "—"}ms
            </span>
            <span>REF: 01.A</span>
            <span>TURNS: {chat.filter(c => c.role === "user").length}</span>
            <span className="ml-auto text-orange-950/70 italic normal-case tracking-normal">
              Internal Knowledge + Web Synthesis
            </span>
          </div>
        </form>
      </motion.footer>

      <style>{`
        @keyframes shimmerBorder {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
        ::selection { background: rgba(234,88,12,0.28); }
      `}</style>
    </div>
  );
}
