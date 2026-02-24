"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./NbaMap.module.css";
import { useRouter } from "next/navigation";
import { useInput } from "@/lib/gamepad";
import clsx from "clsx";
import { NBA_TEAMS, type TeamMapData } from "@/types/nba";

// Team emoji icons based on team name
const TEAM_ICONS: Record<string, string> = {
  Hawks: "🦅",
  Celtics: "☘️",
  Nets: "🏀",
  Hornets: "🐝",
  Bulls: "🐂",
  Cavaliers: "⚔️",
  Mavericks: "🐴",
  Nuggets: "⛏️",
  Pistons: "🔧",
  Warriors: "🌉",
  Rockets: "🚀",
  Pacers: "🏎️",
  Clippers: "⛵",
  Lakers: "👑",
  Grizzlies: "🐻",
  Heat: "🔥",
  Bucks: "🦌",
  Timberwolves: "🐺",
  Pelicans: "🦅",
  Knicks: "🗽",
  Thunder: "⚡",
  Magic: "✨",
  "76ers": "🔔",
  Suns: "☀️",
  "Trail Blazers": "🌲",
  Kings: "👑",
  Spurs: "🤠",
  Raptors: "🦖",
  Jazz: "🎷",
  Wizards: "🧙",
};

export default function NbaMap() {
  const router = useRouter();
  const { input, vibrate } = useInput();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const lastInputTime = useRef(0);

  // Sort teams by position for better navigation (west to east, north to south)
  const sortedTeams = useMemo(() => {
    return [...NBA_TEAMS].sort((a, b) => {
      // Primary sort by x (west to east)
      if (Math.abs(a.x - b.x) > 15) return a.x - b.x;
      // Secondary sort by y (north to south)
      return a.y - b.y;
    });
  }, []);

  useEffect(() => {
    if (!input) return;

    const now = Date.now();
    if (now - lastInputTime.current < 180) return;

    const axes = input.axes || [0, 0, 0, 0];
    const threshold = 0.5;
    const currentTeam = sortedTeams[focusedIndex];

    // Navigate with D-Pad or left stick
    if (input.buttons[15] || axes[0] > threshold) {
      // Right - find next team to the right
      const teamsRight = sortedTeams
        .map((t, i) => ({ ...t, i }))
        .filter((t) => t.x > currentTeam.x + 5)
        .sort((a, b) => {
          const distA = Math.abs(a.y - currentTeam.y) + Math.abs(a.x - currentTeam.x) * 0.5;
          const distB = Math.abs(b.y - currentTeam.y) + Math.abs(b.x - currentTeam.x) * 0.5;
          return distA - distB;
        });
      if (teamsRight.length > 0) {
        setFocusedIndex(teamsRight[0].i);
        vibrate?.(30);
        lastInputTime.current = now;
      }
    } else if (input.buttons[14] || axes[0] < -threshold) {
      // Left - find next team to the left
      const teamsLeft = sortedTeams
        .map((t, i) => ({ ...t, i }))
        .filter((t) => t.x < currentTeam.x - 5)
        .sort((a, b) => {
          const distA = Math.abs(a.y - currentTeam.y) + Math.abs(currentTeam.x - a.x) * 0.5;
          const distB = Math.abs(b.y - currentTeam.y) + Math.abs(currentTeam.x - b.x) * 0.5;
          return distA - distB;
        });
      if (teamsLeft.length > 0) {
        setFocusedIndex(teamsLeft[0].i);
        vibrate?.(30);
        lastInputTime.current = now;
      }
    } else if (input.buttons[13] || axes[1] > threshold) {
      // Down - find next team below
      const teamsBelow = sortedTeams
        .map((t, i) => ({ ...t, i }))
        .filter((t) => t.y > currentTeam.y + 5)
        .sort((a, b) => {
          const distA = Math.abs(a.x - currentTeam.x) + Math.abs(a.y - currentTeam.y) * 0.5;
          const distB = Math.abs(b.x - currentTeam.x) + Math.abs(b.y - currentTeam.y) * 0.5;
          return distA - distB;
        });
      if (teamsBelow.length > 0) {
        setFocusedIndex(teamsBelow[0].i);
        vibrate?.(30);
        lastInputTime.current = now;
      }
    } else if (input.buttons[12] || axes[1] < -threshold) {
      // Up - find next team above
      const teamsAbove = sortedTeams
        .map((t, i) => ({ ...t, i }))
        .filter((t) => t.y < currentTeam.y - 5)
        .sort((a, b) => {
          const distA = Math.abs(a.x - currentTeam.x) + Math.abs(currentTeam.y - a.y) * 0.5;
          const distB = Math.abs(b.x - currentTeam.x) + Math.abs(currentTeam.y - b.y) * 0.5;
          return distA - distB;
        });
      if (teamsAbove.length > 0) {
        setFocusedIndex(teamsAbove[0].i);
        vibrate?.(30);
        lastInputTime.current = now;
      }
    }

    // Cross button to select
    if (input.buttons[0] && now - lastInputTime.current >= 300) {
      vibrate?.(80);
      router.push(`/team/${sortedTeams[focusedIndex].id}`);
      lastInputTime.current = now;
    }
  }, [input, focusedIndex, router, vibrate, sortedTeams]);

  const focusedTeam = sortedTeams[focusedIndex];

  return (
    <div className={styles["map-container"]}>
      {/* SVG Map Background */}
      <svg viewBox="0 0 500 300" className={styles["map-background"]} preserveAspectRatio="none">
        {/* Dark background for the whole area */}
        <rect style={{ fill: "#0a0a0f" }} width={500} height={300} rx={20} />
        
        {/* US Map Polygon Approximation */}
        <polygon
          points="25,45 150,45 300,60 325,90 350,60 475,30 450,120 425,210 450,285 400,240 300,255 250,285 200,225 100,240 50,210 25,120"
          fill="#1a1a2e"
          stroke="#2a2a4e"
          strokeWidth="2"
          opacity="0.8"
        />
        
        {/* Grid lines - masked to the map or just overlaying */}
        <defs>
          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1a1a2e" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="500" height="300" fill="url(#grid)" opacity="0.3" />
        {/* Abstract shapes for visual interest */}
        <circle cx="100" cy="120" r="100" fill="url(#glow1)" opacity="0.3" />
        <circle cx="400" cy="180" r="80" fill="url(#glow2)" opacity="0.3" />
        <defs>
          <radialGradient id="glow1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="glow2">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      <div className={styles["map-cities"]}>
        {sortedTeams.map((team, index) => (
          <button
            key={team.id}
            onClick={() => router.push(`/team/${team.id}`)}
            onMouseEnter={() => setFocusedIndex(index)}
            style={{ "--x": team.x, "--y": team.y } as React.CSSProperties}
            className={clsx(
              styles["map-city"],
              focusedIndex === index && styles["map-city--focused"]
            )}
          >
            <div className={styles["map-city__label"]}>
              <span
                className={clsx(styles["map-city__sign"], styles["anim"], styles["anim-grow"])}
                data-icon={TEAM_ICONS[team.name] || "🏀"}
                style={{
                  "--city-sign-color-back": team.color,
                } as React.CSSProperties}
              >
                {team.city}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Team info panel */}
      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800/50 min-w-[180px]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${focusedTeam.color}30` }}
          >
            {TEAM_ICONS[focusedTeam.name] || "🏀"}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{focusedTeam.fullName}</p>
            <p className="text-xs text-gray-500">{focusedTeam.conference}ern Conference</p>
          </div>
        </div>
      </div>

      {/* Controller hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-cyan-400 font-mono">D-Pad</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-blue-400 font-mono">✕</kbd>
          Select
        </span>
      </div>

      {/* Team count indicator */}
      <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-800/50">
        <span className="text-xs text-gray-400">
          <span className="text-cyan-400 font-bold">{focusedIndex + 1}</span>
          <span className="text-gray-600">/</span>
          <span>{sortedTeams.length}</span>
        </span>
      </div>
    </div>
  );
}
