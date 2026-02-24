import MenuGrid from "@/components/MenuGrid";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 relative overflow-hidden">
      <div className="z-10 text-center space-y-8 w-full max-w-5xl flex flex-col items-center">
        {/* Logo */}
        <div className="relative">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2 animate-gradient bg-[length:200%_auto]">
            DRIFT
          </h1>
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-10 rounded-full" />
        </div>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light tracking-wide">
          Navigate your world
        </p>

        <MenuGrid />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
    </main>
  );
}