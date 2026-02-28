import { API_URL } from "@/lib/config";
import { ChatTurn } from "@/lib/types";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { Dispatch, FormEvent, SetStateAction } from "react";

const Footer = ({
  queryState: { query, setQuery },
  chatState: { chat, setChat },
  loadingState: { loading, setLoading },
}: {
  queryState: {
    query: string;
    setQuery: Dispatch<SetStateAction<string>>;
  };
  chatState: {
    chat: ChatTurn[];
    setChat: Dispatch<SetStateAction<ChatTurn[]>>;
  };
  loadingState: {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
  };
}) => {
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
    <motion.footer
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 bg-[#040404]/90 backdrop-blur-2xl p-4 sm:p-6" // Reduced padding on mobile
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        <div className="group relative">
          <div
            className="absolute -inset-px opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(234,88,12,0.7), rgba(251,146,60,0.2), rgba(234,88,12,0.7))",
              backgroundSize: "200% 100%",
              animation: "shimmerBorder 2.5s ease infinite",
            }}
          />
          <div
            className="relative flex items-center bg-[#080808] group-focus-within:bg-[#0A0808] overflow-hidden" // Added overflow-hidden
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "background 0.3s",
            }}
          >
            {/* Prompt Icon: Hidden on very small screens to save space */}
            <span className="hidden xs:inline-block pl-5 text-sm font-black text-orange-700 group-focus-within:text-orange-500 transition-colors select-none">
              {">"}_
            </span>

            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={e => e.target.focus({ preventScroll: true })} // Mobile jump fix
              placeholder="AWAITING QUERY..."
              className="flex-1 bg-transparent text-white text-xs sm:text-sm uppercase tracking-widest placeholder:text-zinc-800 outline-none h-14 px-4 disabled:cursor-not-allowed min-w-0" // Added min-w-0 and responsive text
              disabled={loading}
              style={{ fontFamily: "inherit" }}
            />

            <motion.button
              type="submit"
              disabled={loading || query.trim().length < 2}
              whileHover={{ backgroundColor: "rgb(249,115,22)" }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-2 h-14 px-4 sm:px-8 bg-orange-600 text-black font-black text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] disabled:opacity-20 transition-colors whitespace-nowrap" // Adjusted padding and tracking
              style={{ boxShadow: "0 0 32px rgba(234,88,12,0.28)" }}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <span className="hidden xs:inline">Execute</span>
                  <Send size={12} />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Metadata row: Added flex-wrap and adjusted gap for mobile */}
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
