"use client";

import { useInput } from "@/lib/gamepad";
import BackButton from "@/components/BackButton";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, MapPin } from "lucide-react";

interface Game {
  id: string;
  opponent: string;
  opponentLogo: string;
  date: string;
  result: "W" | "L";
  score: string;
  location: "Home" | "Away";
  topScorer: string;
}

const MOCK_GAMES: Game[] = [
  {
    id: "1",
    opponent: "Warriors",
    opponentLogo: "bg-blue-600",
    date: "Feb 20, 2026",
    result: "W",
    score: "128 - 121",
    location: "Home",
    topScorer: "LeBron James (36 pts)",
  },
  {
    id: "2",
    opponent: "Suns",
    opponentLogo: "bg-orange-500",
    date: "Feb 18, 2026",
    result: "L",
    score: "113 - 120",
    location: "Away",
    topScorer: "Anthony Davis (28 pts)",
  },
  {
    id: "3",
    opponent: "Nuggets",
    opponentLogo: "bg-amber-700",
    date: "Feb 15, 2026",
    result: "L",
    score: "109 - 115",
    location: "Home",
    topScorer: "Austin Reaves (22 pts)",
  },
  {
    id: "4",
    opponent: "Clippers",
    opponentLogo: "bg-red-600",
    date: "Feb 12, 2026",
    result: "W",
    score: "130 - 118",
    location: "Home",
    topScorer: "LeBron James (29 pts)",
  },
  {
    id: "5",
    opponent: "Mavericks",
    opponentLogo: "bg-blue-800",
    date: "Feb 10, 2026",
    result: "W",
    score: "112 - 108",
    location: "Away",
    topScorer: "Anthony Davis (31 pts)",
  },
];

export default function LakersHub() {
  const { input, vibrate } = useInput();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const lastInputTime = useRef(0);
  const INPUT_DELAY = 150;

  useEffect(() => {
    if (!input) return;

    const now = Date.now();
    if (now - lastInputTime.current < INPUT_DELAY) return;

    const { buttons, axes } = input;

    let direction = 0;
    if (buttons[12] || axes[1] < -0.5) direction = -1;
    if (buttons[13] || axes[1] > 0.5) direction = 1;

    if (direction !== 0) {
      setFocusedIndex((prev) => {
        let next = prev + direction;
        if (next < 0) next = MOCK_GAMES.length - 1;
        if (next >= MOCK_GAMES.length) next = 0;
        return next;
      });
      vibrate(30, 0.3, 0);
      lastInputTime.current = now;
    }
  }, [input, vibrate]);

  const focusedGame = MOCK_GAMES[focusedIndex];
  const wins = MOCK_GAMES.filter((g) => g.result === "W").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#030305] text-white overflow-hidden p-8 pt-24 relative">
      <BackButton />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-10 max-w-6xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-xl font-black text-yellow-400 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            LAL
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
              Lakers
            </h1>
            <p className="text-gray-500 text-sm">2025-26 Season</p>
          </div>
        </div>

        {/* Record */}
        <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-full px-4 py-2 backdrop-blur-sm">
          <span className="text-emerald-400 font-bold">{wins}W</span>
          <span className="text-gray-600">-</span>
          <span className="text-red-400 font-bold">{MOCK_GAMES.length - wins}L</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto relative z-10">
        {/* Game List */}
        <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
          {MOCK_GAMES.map((game, index) => {
            const isFocused = index === focusedIndex;
            return (
              <motion.div
                key={game.id}
                className={`p-4 rounded-xl border cursor-pointer relative transition-all duration-200
                  ${
                    isFocused
                      ? "bg-purple-900/30 border-purple-500/50 scale-[1.02]"
                      : "bg-gray-900/30 border-gray-800/50 opacity-50 hover:opacity-70"
                  }
                `}
                onClick={() => setFocusedIndex(index)}
                layoutId={`game-card-${game.id}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${game.opponentLogo}`}
                    >
                      {game.opponent.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-sm ${isFocused ? "text-white" : "text-gray-400"}`}>
                        vs {game.opponent}
                      </h3>
                      <p className="text-xs text-gray-600">{game.date}</p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold px-2 py-1 rounded ${
                      game.result === "W" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {game.result}
                  </div>
                </div>

                {isFocused && (
                  <motion.div
                    layoutId="list-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-yellow-500 rounded-l-xl"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Game Details */}
        <div className="lg:col-span-2 bg-gray-900/40 rounded-2xl border border-gray-800/50 p-6 flex flex-col overflow-hidden relative backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={focusedGame.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Score */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Lakers</p>
                    <div className="text-5xl font-bold text-yellow-400">{focusedGame.score.split(" - ")[0]}</div>
                  </div>
                  <div className="text-gray-700 text-xl font-light">—</div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{focusedGame.opponent}</p>
                    <div className="text-5xl font-bold text-white">{focusedGame.score.split(" - ")[1]}</div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5
                  ${focusedGame.result === "W" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
                `}
                >
                  {focusedGame.result === "W" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {focusedGame.result === "W" ? "WIN" : "LOSS"}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-2 mb-2 text-purple-400">
                    <Clock size={16} />
                    <span className="text-xs font-medium uppercase tracking-wider">Date</span>
                  </div>
                  <p className="text-lg font-semibold">{focusedGame.date}</p>
                  <p className="text-gray-600 text-xs">7:30 PM PT</p>
                </div>

                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-2 mb-2 text-cyan-400">
                    <MapPin size={16} />
                    <span className="text-xs font-medium uppercase tracking-wider">Venue</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {focusedGame.location === "Home" ? "Crypto.com Arena" : "Away"}
                  </p>
                  <p className="text-gray-600 text-xs">{focusedGame.location}</p>
                </div>
              </div>

              {/* Player Spotlight */}
              <div className="mt-auto bg-gradient-to-r from-purple-900/40 to-transparent p-4 rounded-xl border border-purple-500/20">
                <p className="text-xs text-purple-400 mb-1 uppercase tracking-wider">Top Performer</p>
                <div className="text-xl font-bold text-white">{focusedGame.topScorer.split(" (")[0]}</div>
                <div className="text-lg text-yellow-400 font-mono">
                  {focusedGame.topScorer.split(" (")[1]?.replace(")", "")}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>

      {/* Controller hint */}
      <div className="flex justify-center mt-8 relative z-10">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-purple-400 font-mono text-[10px]">
              ↑↓
            </kbd>
            Navigate games
          </span>
        </div>
      </div>
    </div>
  );
}
