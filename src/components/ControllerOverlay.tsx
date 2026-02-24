"use client";

import { useGamepad } from "@/lib/gamepad";
import { motion } from "framer-motion";

export default function ControllerOverlay() {
  const { gamepad } = useGamepad();

  if (!gamepad) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/50 p-2 rounded text-white text-xs">
        No Controller Detected
      </div>
    );
  }

  const buttons = gamepad.buttons; // Array of booleans
  const axes = gamepad.axes; // Array of floats (-1 to 1)

  // Helper to check button state safely
  const isPressed = (index: number) => (buttons[index] ? "bg-blue-500 scale-110" : "bg-gray-700");

  return (
    <div className="fixed bottom-8 right-8 w-64 h-40 bg-gray-900/80 rounded-xl p-4 border border-gray-700 shadow-2xl backdrop-blur-sm z-50">
      <div className="relative w-full h-full">
        {/* L1 & R1 */}
        <div className={`absolute top-0 left-4 w-12 h-4 rounded-t-lg transition-all ${isPressed(4)}`} />
        <div className={`absolute top-0 right-4 w-12 h-4 rounded-t-lg transition-all ${isPressed(5)}`} />

        {/* L2 & R2 (Triggers - often analog, but simplifying to boolean for visual) */}
        <div className={`absolute -top-2 left-4 w-12 h-2 rounded-t-sm transition-all ${buttons[6] ? "bg-blue-600 h-4" : "bg-gray-800"}`} />
        <div className={`absolute -top-2 right-4 w-12 h-2 rounded-t-sm transition-all ${buttons[7] ? "bg-blue-600 h-4" : "bg-gray-800"}`} />

        {/* D-Pad */}
        <div className="absolute top-12 left-4 w-16 h-16">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-t ${isPressed(12)}`} /> {/* Up */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-b ${isPressed(13)}`} /> {/* Down */}
          <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-5 h-5 rounded-l ${isPressed(14)}`} /> {/* Left */}
          <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-5 h-5 rounded-r ${isPressed(15)}`} /> {/* Right */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-gray-800" /> {/* Center */}
        </div>

        {/* Face Buttons */}
        <div className="absolute top-12 right-4 w-16 h-16">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full ${isPressed(3)} border-2 border-green-500/50`} /> {/* Triangle */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full ${isPressed(0)} border-2 border-blue-500/50`} /> {/* Cross */}
          <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-5 h-5 rounded-full ${isPressed(2)} border-2 border-pink-500/50`} /> {/* Square */}
          <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-5 h-5 rounded-full ${isPressed(1)} border-2 border-red-500/50`} /> {/* Circle */}
        </div>

        {/* Joysticks */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
          {/* Left Stick */}
          <div className="w-10 h-10 bg-gray-800 rounded-full border border-gray-600 relative overflow-hidden">
            <motion.div
              className={`absolute w-6 h-6 rounded-full bg-gray-500 ${isPressed(10)}`}
              animate={{
                x: (axes[0] || 0) * 10,
                y: (axes[1] || 0) * 10,
              }}
              style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            />
          </div>
          {/* Right Stick */}
          <div className="w-10 h-10 bg-gray-800 rounded-full border border-gray-600 relative overflow-hidden">
             <motion.div
              className={`absolute w-6 h-6 rounded-full bg-gray-500 ${isPressed(11)}`}
              animate={{
                x: (axes[2] || 0) * 10,
                y: (axes[3] || 0) * 10,
              }}
              style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            />
          </div>
        </div>

        {/* Center Buttons */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4">
           <div className={`w-6 h-3 rounded-full ${isPressed(8)}`} /> {/* Share */}
           <div className={`w-8 h-5 rounded-md ${isPressed(16)} bg-blue-900/50`} /> {/* PS Button */}
           <div className={`w-6 h-3 rounded-full ${isPressed(9)}`} /> {/* Options */}
        </div>

      </div>
    </div>
  );
}
