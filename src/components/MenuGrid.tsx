"use client";

import { useInput } from "@/lib/gamepad";
import { Dumbbell, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const MENU_ITEMS = [
  {
    id: "nba-universe",
    title: "NBA Universe",
    href: "/nba",
    icon: Globe,
    color: "purple",
    desc: "Explore teams on the map",
  },
  {
    id: "workouts",
    title: "Workouts",
    href: "/workouts",
    icon: Dumbbell,
    color: "cyan",
    desc: "Track your grind",
  },
];

const COLOR_STYLES = {
  cyan: {
    border: "border-cyan-500",
    text: "text-cyan-400",
    bg: "bg-cyan-500/20",
    ring: "ring-cyan-500/40",
    shadow: "shadow-[0_0_40px_rgba(6,182,212,0.25)]",
    glow: "from-cyan-500/20 to-transparent",
  },
  purple: {
    border: "border-purple-500",
    text: "text-purple-400",
    bg: "bg-purple-500/20",
    ring: "ring-purple-500/40",
    shadow: "shadow-[0_0_40px_rgba(168,85,247,0.25)]",
    glow: "from-purple-500/20 to-transparent",
  },
};

export default function MenuGrid() {
  const { input, vibrate } = useInput();
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const lastInputTime = useRef(0);

  const INPUT_DELAY = 200;

  useEffect(() => {
    if (!input) return;

    const now = Date.now();
    if (now - lastInputTime.current < INPUT_DELAY) return;

    const { buttons, axes } = input;

    let direction = 0;
    if (buttons[14] || (axes[0] && axes[0] < -0.5)) direction = -1;
    if (buttons[15] || (axes[0] && axes[0] > 0.5)) direction = 1;

    if (direction !== 0) {
      setFocusedIndex((prev) => {
        let next = prev + direction;
        if (next < 0) next = MENU_ITEMS.length - 1;
        if (next >= MENU_ITEMS.length) next = 0;
        return next;
      });
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }

    if (buttons[0]) {
      vibrate(100, 1.0, 1.0);
      router.push(MENU_ITEMS[focusedIndex].href);
      lastInputTime.current = now + 500;
    }
  }, [input, focusedIndex, router, vibrate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 w-full max-w-3xl z-10">
      {MENU_ITEMS.map((item, index) => {
        const isFocused = index === focusedIndex;
        const Icon = item.icon;
        const colors = COLOR_STYLES[item.color as keyof typeof COLOR_STYLES];

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`group relative p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 flex flex-col items-center gap-4 overflow-hidden
              ${isFocused
                ? `bg-gray-900/80 scale-[1.02] ${colors.border} ${colors.shadow}`
                : "bg-gray-900/40 border-gray-800/50 opacity-60 hover:opacity-80"
              }
            `}
            onMouseEnter={() => setFocusedIndex(index)}
          >
            {/* Background glow */}
            {isFocused && (
              <motion.div
                layoutId="menuGlow"
                className={`absolute inset-0 bg-gradient-to-b ${colors.glow} pointer-events-none`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}

            <div
              className={`relative z-10 p-4 rounded-xl transition-all duration-300 ${
                isFocused ? `${colors.bg} ${colors.text}` : "bg-gray-800/50 text-gray-500"
              }`}
            >
              <Icon className="w-10 h-10" strokeWidth={1.5} />
            </div>

            <h2
              className={`relative z-10 text-2xl font-semibold tracking-tight transition-colors ${
                isFocused ? "text-white" : "text-gray-400"
              }`}
            >
              {item.title}
            </h2>

            <p className="relative z-10 text-sm text-gray-500">{item.desc}</p>

            {/* Focus ring */}
            {isFocused && (
              <motion.div
                layoutId="focusRing"
                className={`absolute inset-0 rounded-2xl ring-2 ${colors.ring} pointer-events-none`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </Link>
        );
      })}

      {/* Controller hint */}
      <div className="col-span-full flex justify-center mt-4">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-gray-400 font-mono text-[10px]">
              ← →
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-blue-400 font-mono text-[10px]">
              ✕
            </kbd>
            Select
          </span>
        </div>
      </div>
    </div>
  );
}
