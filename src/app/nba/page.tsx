"use client";

import NbaMap from "@/components/NbaMap";
import BackButton from "@/components/BackButton";

export default function NbaMapPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030305] text-white p-8 pt-24 items-center relative overflow-hidden">
      <BackButton />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mb-8 text-center relative z-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          NBA Universe
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Select a city to explore</p>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <NbaMap />
      </div>
    </div>
  );
}
