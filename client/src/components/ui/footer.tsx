import { API_URL } from "@/lib/config";
import { ChatTurn } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, CornerDownLeft } from "lucide-react";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

const MAX_ROWS = 6;
const LINE_HEIGHT = 22; // px — matches text-sm + leading
const BASE_HEIGHT = 56; // px — single-line "resting" height

const Footer = ({
  queryState: { query, setQuery },
  chatState: { chat, setChat },
  loadingState: { loading, setLoading },
}: {
  queryState: { query: string; setQuery: Dispatch<SetStateAction<string>> };
  chatState: {
    chat: ChatTurn[];
    setChat: Dispatch<SetStateAction<ChatTurn[]>>;
  };
  loadingState: {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
  };
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [rows, setRows] = useState(1);

  // ── Auto-resize ───────────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const scrollH = el.scrollHeight;
    const maxH = BASE_HEIGHT + LINE_HEIGHT * (MAX_ROWS - 1);
    const clamped = Math.min(scrollH, maxH);
    el.style.height = `${clamped}px`;
    // Track logical row count for subtle UI hints
    const computed = Math.round((scrollH - 24) / LINE_HEIGHT);
    setRows(Math.max(1, Math.min(computed, MAX_ROWS)));
  }, []);

  useEffect(() => {
    resize();
  }, [query, resize]);

  // ── API call ──────────────────────────────────────────────────────────────
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
      if (!res.ok)
        throw new Error(data.message ?? data.error ?? "Search failed");
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
          content: `${err.message}` || "System Fault. Request Terminated.",
          sources: [],
          time: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const submit = () => {
    const p = query.trim();
    if (!p || loading) return;
    setQuery("");
    // Reset height manually
    if (textareaRef.current) {
      textareaRef.current.style.height = `${BASE_HEIGHT}px`;
      setRows(1);
    }
    runSearch(p);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Cmd/Ctrl+Enter or plain Enter (when single line) submits; Shift+Enter = newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return; // allow newline
      if (e.metaKey || e.ctrlKey || rows === 1) {
        e.preventDefault();
        submit();
      }
    }
  };

  const charCount = query.length;
  const isNearLimit = charCount > 320;
  const isOverLimit = charCount > 400;

  return (
    <motion.footer
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 bg-[#040404]/90 backdrop-blur-2xl px-4 sm:px-6 pt-4 pb-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        {/* ── Input shell ── */}
        <div className="group relative">
          {/* Animated border glow on focus */}
          <motion.div
            animate={{
              opacity: focused ? 1 : 0,
              backgroundPosition: focused ? ["0% 50%", "200% 50%"] : "0% 50%",
            }}
            transition={{
              opacity: { duration: 0.4 },
              backgroundPosition: {
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
              },
            }}
            className="absolute -inset-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(234,88,12,0.8), rgba(251,146,60,0.3), rgba(234,88,12,0.8))",
              backgroundSize: "200% 100%",
            }}
          />

          {/* Inner box */}
          <div
            className="relative flex items-end bg-[#080808] overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "background 0.3s",
              background: focused ? "#0A0808" : "#080808",
            }}
          >
            {/* Prompt sigil — sticks to bottom when multiline */}
            <motion.span
              animate={{
                color: focused ? "rgb(249,115,22)" : "rgb(154,52,18)",
                opacity: focused ? 1 : 0.6,
              }}
              transition={{ duration: 0.25 }}
              className="hidden xs:flex items-center self-end pb-[18px] pl-5 text-sm font-black select-none shrink-0"
              style={{ fontFamily: "inherit" }}
            >
              {">"}_
            </motion.span>

            {/* ── Textarea ── */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="AWAITING QUERY..."
              rows={1}
              disabled={loading}
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
              className="flex-1 bg-transparent text-white text-xs sm:text-sm uppercase tracking-widest placeholder:text-zinc-800 outline-none resize-none px-4 py-[17px] disabled:cursor-not-allowed min-w-0 overflow-y-auto leading-[22px]"
              style={{
                fontFamily: "inherit",
                height: `${BASE_HEIGHT}px`,
                maxHeight: `${BASE_HEIGHT + LINE_HEIGHT * (MAX_ROWS - 1)}px`,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(234,88,12,0.3) transparent",
              }}
            />

            {/* ── Right column: The Stack ── */}
            <div className="flex flex-col items-end justify-center self-stretch pr-2 shrink-0">
              {/* 1. The Anchor Point (Zero Height) */}
              <div className="relative w-full h-0 flex justify-end">
                <AnimatePresence>
                  {charCount > 0 && (
                    <motion.span
                      key="counter"
                      /* We start at y: 0 (on top of the button) and reveal upwards */
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: -12, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute text-[8px] left-[-7%] font-black tabular-nums tracking-[0.3em] px-1.5 py-0.5 whitespace-nowrap"
                      style={{
                        color: isOverLimit
                          ? "#fca5a5"
                          : isNearLimit
                            ? "#fb923c"
                            : "#52525b",
                        // Keep it inside the box by not pushing 'y' too far
                      }}
                    >
                      {charCount}
                      {isNearLimit && <span className="opacity-40">/400</span>}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. The Button (The stable anchor) */}
              <motion.button
                type="submit"
                disabled={loading || query.trim().length < 2 || isOverLimit}
                whileHover={{ backgroundColor: "rgb(249,115,22)", scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-1.5 h-10 px-4 sm:px-6 bg-orange-600 text-black font-black text-[9px] uppercase tracking-[0.25em] z-10"
                style={{ boxShadow: "0 0 24px rgba(234,88,12,0.28)" }}
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <span className="hidden xs:inline">Execute</span>
                    <Send size={11} />
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Multiline hint + keyboard shortcut */}
          <AnimatePresence>
            {focused && rows > 1 && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
                className="absolute -bottom-6 left-1 flex items-center gap-1.5 text-[8px] text-zinc-700 font-bold tracking-[0.3em] uppercase pointer-events-none"
              >
                <CornerDownLeft size={8} className="text-zinc-700" />
                <span>Shift+Enter newline · Enter submit</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Metadata row ── */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[7px] sm:text-[8px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-zinc-800 px-1">
          <span className="tabular-nums whitespace-nowrap">
            LAT: {chat[chat.length - 1]?.time ?? "—"}ms
          </span>
          <span className="whitespace-nowrap">REF: 01.A</span>
          <span className="whitespace-nowrap">
            TURNS: {chat.filter(c => c.role === "user").length}
          </span>
          <span className="ml-auto text-orange-950/70 italic normal-case tracking-normal hidden xs:block">
            Internal Knowledge + Web Synthesis
          </span>
        </div>
      </form>
    </motion.footer>
  );
};

export default Footer;
