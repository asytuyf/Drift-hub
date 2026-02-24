"use client";

import { useInput } from "@/lib/gamepad";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const { input, vibrate } = useInput();
  const router = useRouter();
  const lastInputTime = useRef(0);

  useEffect(() => {
    if (!input) return;

    const { buttons } = input;
    const now = Date.now();

    if (buttons[1] && now - lastInputTime.current > 500) {
      vibrate(50, 0.5, 0.5);
      router.back();
      lastInputTime.current = now;
    }
  }, [input, router, vibrate]);

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-white transition-all z-50 group"
    >
      <div className="w-9 h-9 rounded-full bg-gray-900/80 border border-gray-800 flex items-center justify-center group-hover:border-gray-600 group-hover:bg-gray-800 transition-all backdrop-blur-sm">
        <ChevronLeft className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-1.5 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="font-medium text-gray-300">Back</span>
        <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-700 rounded text-[10px] text-red-400 font-mono">
          ○
        </kbd>
      </div>
    </button>
  );
}
