"use client";

import { useInput } from "@/lib/gamepad";
import React from "react";
import clsx from "clsx";

export default function VirtualController() {
  const { input, simulateButton } = useInput();

  const handlePress = (index: number) => {
    simulateButton(index, true);
    setTimeout(() => simulateButton(index, false), 200);
  };

  const isPressed = (index: number) => input?.buttons[index];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex-col items-center gap-3 pointer-events-auto hidden md:flex">
      {/* Controller Body */}
      <div className="relative w-80 h-48 select-none">
        {/* Main body with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2rem] shadow-2xl border border-gray-700/50">
          {/* Inner shadow for depth */}
          <div className="absolute inset-[2px] rounded-[1.9rem] bg-gradient-to-b from-gray-800/50 to-transparent pointer-events-none" />
        </div>

        {/* Shoulder Buttons */}
        <div className="absolute -top-1 left-8 right-8 flex justify-between">
          {/* L1 */}
          <button
            className={clsx(
              "w-14 h-5 rounded-t-lg transition-all duration-100",
              isPressed(4)
                ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] translate-y-[2px]"
                : "bg-gray-700 hover:bg-gray-600"
            )}
            onMouseDown={() => handlePress(4)}
          >
            <span className="text-[10px] font-bold text-gray-300">L1</span>
          </button>
          {/* R1 */}
          <button
            className={clsx(
              "w-14 h-5 rounded-t-lg transition-all duration-100",
              isPressed(5)
                ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] translate-y-[2px]"
                : "bg-gray-700 hover:bg-gray-600"
            )}
            onMouseDown={() => handlePress(5)}
          >
            <span className="text-[10px] font-bold text-gray-300">R1</span>
          </button>
        </div>

        {/* D-Pad */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2">
          <div className="relative w-20 h-20">
            {/* Up */}
            <button
              className={clsx(
                "absolute top-0 left-1/2 -translate-x-1/2 w-6 h-7 rounded-t-md transition-all duration-75",
                isPressed(12)
                  ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                  : "bg-gray-700 hover:bg-gray-600"
              )}
              onMouseDown={() => handlePress(12)}
            />
            {/* Down */}
            <button
              className={clsx(
                "absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-7 rounded-b-md transition-all duration-75",
                isPressed(13)
                  ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                  : "bg-gray-700 hover:bg-gray-600"
              )}
              onMouseDown={() => handlePress(13)}
            />
            {/* Left */}
            <button
              className={clsx(
                "absolute top-1/2 left-0 -translate-y-1/2 h-6 w-7 rounded-l-md transition-all duration-75",
                isPressed(14)
                  ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                  : "bg-gray-700 hover:bg-gray-600"
              )}
              onMouseDown={() => handlePress(14)}
            />
            {/* Right */}
            <button
              className={clsx(
                "absolute top-1/2 right-0 -translate-y-1/2 h-6 w-7 rounded-r-md transition-all duration-75",
                isPressed(15)
                  ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                  : "bg-gray-700 hover:bg-gray-600"
              )}
              onMouseDown={() => handlePress(15)}
            />
            {/* Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 rounded-sm" />
          </div>
        </div>

        {/* Face Buttons */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2">
          <div className="relative w-20 h-20">
            {/* Triangle - Top */}
            <button
              className={clsx(
                "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-75 border-2",
                isPressed(3)
                  ? "bg-emerald-500/90 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.7)]"
                  : "bg-gray-800 border-emerald-500/40 hover:border-emerald-500/60"
              )}
              onMouseDown={() => handlePress(3)}
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12">
                <polygon points="6,1 11,10 1,10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400" />
              </svg>
            </button>

            {/* Cross - Bottom */}
            <button
              className={clsx(
                "absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-75 border-2",
                isPressed(0)
                  ? "bg-blue-500/90 border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.7)]"
                  : "bg-gray-800 border-blue-500/40 hover:border-blue-500/60"
              )}
              onMouseDown={() => handlePress(0)}
            >
              <span className="text-blue-400 font-bold text-sm">✕</span>
            </button>

            {/* Square - Left */}
            <button
              className={clsx(
                "absolute top-1/2 left-0 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-75 border-2",
                isPressed(2)
                  ? "bg-pink-500/90 border-pink-400 shadow-[0_0_16px_rgba(236,72,153,0.7)]"
                  : "bg-gray-800 border-pink-500/40 hover:border-pink-500/60"
              )}
              onMouseDown={() => handlePress(2)}
            >
              <div className="w-2.5 h-2.5 border-[1.5px] border-pink-400" />
            </button>

            {/* Circle - Right */}
            <button
              className={clsx(
                "absolute top-1/2 right-0 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-75 border-2",
                isPressed(1)
                  ? "bg-red-500/90 border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                  : "bg-gray-800 border-red-500/40 hover:border-red-500/60"
              )}
              onMouseDown={() => handlePress(1)}
            >
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-red-400" />
            </button>
          </div>
        </div>

        {/* Center touchpad/logo area */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <div className="w-16 h-8 bg-gray-950 rounded-lg border border-gray-700/50 flex items-center justify-center overflow-hidden">
            <span className="text-[10px] font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              DRIFT
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
