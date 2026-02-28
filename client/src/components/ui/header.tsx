import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import React from "react";

const Header = () => {
  return (
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
        <div className="">
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
  );
};

export default Header;
