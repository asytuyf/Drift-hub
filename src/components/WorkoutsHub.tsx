"use client";

import { useInput } from "@/lib/gamepad";
import BackButton from "@/components/BackButton";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Timer, ChevronRight, Weight, RotateCcw, Plus, X, Trash2, Lock, Unlock } from "lucide-react";
import workoutsData from "@/data/workouts.json";
import type { Workout, Exercise } from "@/types/workout";
import { searchExercise, type WgerExercise } from "@/lib/exercisedb";

type ViewMode = "list" | "detail" | "addExercise" | "password";

const STORAGE_KEY = "drift-workouts-exercises";

function loadWorkouts(): Workout[] {
  if (typeof window === "undefined") return workoutsData.workouts;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return workoutsData.workouts;
    }
  }
  return workoutsData.workouts;
}

function saveWorkouts(workouts: Workout[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export default function WorkoutsHub() {
  const router = useRouter();
  const { input, vibrate } = useInput();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [focusedWorkoutIndex, setFocusedWorkoutIndex] = useState(0);
  const [focusedExerciseIndex, setFocusedExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState<Map<string, WgerExercise | null>>(new Map());
  const [isAdmin, setIsAdmin] = useState(false);

  // PIN pad state (4 digits)
  const [pinDigits, setPinDigits] = useState([0, 0, 0, 0]);
  const [pinIndex, setPinIndex] = useState(0);
  const [pinError, setPinError] = useState(false);

  const lastInputTime = useRef(0);
  const mountTime = useRef(Date.now());
  const INPUT_DELAY = 150;
  const PIN_INPUT_DELAY = 120;

  // Form state for adding exercise
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: "",
    sets: 3,
    reps: 10,
    weight: undefined,
    restSeconds: 60,
  });

  // Load workouts on mount
  useEffect(() => {
    setWorkouts(loadWorkouts());
  }, []);

  // Save workouts when they change
  useEffect(() => {
    if (workouts.length > 0) {
      saveWorkouts(workouts);
    }
  }, [workouts]);

  const selectedWorkout = workouts[focusedWorkoutIndex];
  const selectedExercise = selectedWorkout?.exercises[focusedExerciseIndex];

  // Fetch exercise images when workout changes
  const fetchExerciseImages = useCallback(async (exercises: Exercise[]) => {
    for (const exercise of exercises) {
      if (!exerciseData.has(exercise.name)) {
        const data = await searchExercise(exercise.name);
        setExerciseData((prev) => new Map(prev).set(exercise.name, data));
      }
    }
  }, [exerciseData]);

  useEffect(() => {
    if (selectedWorkout) {
      fetchExerciseImages(selectedWorkout.exercises);
    }
  }, [selectedWorkout, fetchExerciseImages]);

  // Verify PIN against environment variable
  const verifyPin = async (pin: string) => {
    try {
      const res = await fetch("/api/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  };

  const handlePinSubmit = async () => {
    const pin = pinDigits.join("");
    const isValid = await verifyPin(pin);

    if (isValid) {
      setIsAdmin(true);
      setViewMode("list");
      setPinDigits([0, 0, 0, 0]);
      setPinIndex(0);
      setPinError(false);
      vibrate(100, 1.0, 1.0);
    } else {
      setPinError(true);
      vibrate(200, 0.8, 0);
      // Reset after shake
      setTimeout(() => {
        setPinDigits([0, 0, 0, 0]);
        setPinIndex(0);
        setPinError(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (!input) return;

    const now = Date.now();
    if (now - mountTime.current < 500) return;

    const { buttons, axes } = input;

    // PIN pad controls
    if (viewMode === "password") {
      if (now - lastInputTime.current < PIN_INPUT_DELAY) return;

      // Left/Right to move between digits
      if (buttons[14] || axes[0] < -0.5) {
        setPinIndex((prev) => Math.max(0, prev - 1));
        vibrate(20, 0.2, 0);
        lastInputTime.current = now;
      }
      if (buttons[15] || axes[0] > 0.5) {
        setPinIndex((prev) => Math.min(3, prev + 1));
        vibrate(20, 0.2, 0);
        lastInputTime.current = now;
      }

      // Up/Down to change digit value
      if (buttons[12] || axes[1] < -0.5) {
        setPinDigits((prev) => {
          const newDigits = [...prev];
          newDigits[pinIndex] = (newDigits[pinIndex] + 1) % 10;
          return newDigits;
        });
        vibrate(20, 0.2, 0);
        lastInputTime.current = now;
      }
      if (buttons[13] || axes[1] > 0.5) {
        setPinDigits((prev) => {
          const newDigits = [...prev];
          newDigits[pinIndex] = (newDigits[pinIndex] - 1 + 10) % 10;
          return newDigits;
        });
        vibrate(20, 0.2, 0);
        lastInputTime.current = now;
      }

      // X to confirm
      if (buttons[0] && now - lastInputTime.current > 300) {
        handlePinSubmit();
        lastInputTime.current = now;
      }

      // O to cancel
      if (buttons[1] && now - lastInputTime.current > 300) {
        setViewMode("list");
        setPinDigits([0, 0, 0, 0]);
        setPinIndex(0);
        setPinError(false);
        vibrate(50, 0.5, 0);
        lastInputTime.current = now;
      }

      return;
    }

    if (now - lastInputTime.current < INPUT_DELAY) return;

    // Workout list navigation (horizontal)
    if (viewMode === "list") {
      let hDirection = 0;
      if (buttons[14] || axes[0] < -0.5) hDirection = -1;
      if (buttons[15] || axes[0] > 0.5) hDirection = 1;

      if (hDirection !== 0) {
        setFocusedWorkoutIndex((prev) => {
          let next = prev + hDirection;
          if (next < 0) next = workouts.length - 1;
          if (next >= workouts.length) next = 0;
          return next;
        });
        vibrate(30, 0.3, 0);
        lastInputTime.current = now;
      }
    }

    // Exercise list navigation (vertical)
    if (viewMode === "detail") {
      let vDirection = 0;
      if (buttons[12] || axes[1] < -0.5) vDirection = -1;
      if (buttons[13] || axes[1] > 0.5) vDirection = 1;

      if (vDirection !== 0 && selectedWorkout) {
        setFocusedExerciseIndex((prev) => {
          const exercises = selectedWorkout.exercises;
          let next = prev + vDirection;
          if (next < 0) next = exercises.length - 1;
          if (next >= exercises.length) next = 0;
          return next;
        });
        vibrate(30, 0.3, 0);
        lastInputTime.current = now;
      }
    }

    // Select (✕ button)
    if (buttons[0] && viewMode === "list" && now - lastInputTime.current > 300) {
      setViewMode("detail");
      setFocusedExerciseIndex(0);
      vibrate(100, 1.0, 1.0);
      lastInputTime.current = now;
    }

    // L1/R1 to toggle admin mode
    if ((buttons[4] || buttons[5]) && (viewMode === "list" || viewMode === "detail") && now - lastInputTime.current > 300) {
      if (isAdmin) {
        setIsAdmin(false);
        vibrate(50, 0.5, 0);
      } else {
        setViewMode("password");
        setPinDigits([0, 0, 0, 0]);
        setPinIndex(0);
        vibrate(50, 0.5, 0);
      }
      lastInputTime.current = now;
    }

    // Back (◯ button)
    if (buttons[1] && now - lastInputTime.current > 300) {
      if (viewMode === "addExercise") {
        setViewMode("detail");
      } else if (viewMode === "detail") {
        setViewMode("list");
      } else {
        router.push("/");
      }
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }

    // Triangle button - Add exercise (admin only)
    if (buttons[3] && viewMode === "detail" && isAdmin && now - lastInputTime.current > 300) {
      setViewMode("addExercise");
      setNewExercise({ name: "", sets: 3, reps: 10, weight: undefined, restSeconds: 60 });
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }

    // Square button - Delete exercise (admin only)
    if (buttons[2] && viewMode === "detail" && isAdmin && selectedExercise && now - lastInputTime.current > 300) {
      handleDeleteExercise(focusedExerciseIndex);
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }
  }, [input, viewMode, workouts.length, selectedWorkout, vibrate, router, isAdmin, selectedExercise, focusedExerciseIndex, pinIndex]);

  const handleAddExercise = () => {
    if (!newExercise.name || !isAdmin) return;

    const exercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExercise.name,
      sets: newExercise.sets || 3,
      reps: newExercise.reps || 10,
      weight: newExercise.weight ? Math.round(newExercise.weight * 2.205) : undefined,
      restSeconds: newExercise.restSeconds || 60,
    };

    setWorkouts(prev => {
      const updated = [...prev];
      updated[focusedWorkoutIndex] = {
        ...updated[focusedWorkoutIndex],
        exercises: [...updated[focusedWorkoutIndex].exercises, exercise],
      };
      return updated;
    });

    setViewMode("detail");
    setFocusedExerciseIndex(workouts[focusedWorkoutIndex].exercises.length);
  };

  const handleDeleteExercise = (index: number) => {
    if (!isAdmin) return;

    setWorkouts(prev => {
      const updated = [...prev];
      updated[focusedWorkoutIndex] = {
        ...updated[focusedWorkoutIndex],
        exercises: updated[focusedWorkoutIndex].exercises.filter((_, i) => i !== index),
      };
      return updated;
    });

    if (focusedExerciseIndex >= workouts[focusedWorkoutIndex].exercises.length - 1) {
      setFocusedExerciseIndex(Math.max(0, focusedExerciseIndex - 1));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030305] text-white p-8 pt-24 overflow-hidden relative">
      <BackButton />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* PIN Pad Modal */}
      <AnimatePresence>
        {viewMode === "password" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: pinError ? [0, -10, 10, -10, 10, 0] : 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ x: { duration: 0.4 } }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm"
            >
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Lock size={24} className="text-amber-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-2">Enter PIN</h2>
              <p className="text-sm text-gray-500 text-center mb-8">Use D-pad to enter your 4-digit PIN</p>

              {/* PIN Display */}
              <div className="flex justify-center gap-4 mb-8">
                {pinDigits.map((digit, i) => (
                  <div
                    key={i}
                    className={`w-16 h-20 rounded-xl border-2 flex items-center justify-center text-4xl font-bold transition-all ${
                      i === pinIndex
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 scale-110"
                        : "border-gray-700 bg-gray-800/50 text-white"
                    } ${pinError ? "border-red-500" : ""}`}
                  >
                    {digit}
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="flex flex-col gap-2 text-xs text-gray-500 mb-6">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">↑↓</kbd>
                    Change digit
                  </span>
                  <span className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">←→</kbd>
                    Move
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-blue-400">✕</kbd>
                    Confirm
                  </span>
                  <span className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-red-400">○</kbd>
                    Cancel
                  </span>
                </div>
              </div>

              {pinError && (
                <p className="text-red-400 text-sm text-center">Incorrect PIN</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {viewMode === "addExercise" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewMode("detail")}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add Exercise</h2>
                <button
                  onClick={() => setViewMode("detail")}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Exercise Name</label>
                  <input
                    type="text"
                    value={newExercise.name || ""}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., Barbell Squat"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Sets</label>
                    <input
                      type="number"
                      value={newExercise.sets || ""}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Reps</label>
                    <input
                      type="number"
                      value={newExercise.reps || ""}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, reps: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      value={newExercise.weight || ""}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Optional"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rest (seconds)</label>
                    <input
                      type="number"
                      value={newExercise.restSeconds || ""}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, restSeconds: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      min="0"
                      step="15"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddExercise}
                  disabled={!newExercise.name}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Exercise
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: viewMode === "detail" && selectedWorkout ? `${selectedWorkout.color}20` : "rgb(6 182 212 / 0.2)",
              boxShadow: viewMode === "detail" && selectedWorkout ? `0 0 30px ${selectedWorkout.color}30` : "0 0 30px rgba(6,182,212,0.3)"
            }}
          >
            <Dumbbell size={28} style={{ color: viewMode === "detail" && selectedWorkout ? selectedWorkout.color : "#06b6d4" }} />
          </div>
          <div>
            <h1
              className="text-3xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: viewMode === "detail" && selectedWorkout
                  ? `linear-gradient(to right, ${selectedWorkout.color}, #a855f7)`
                  : "linear-gradient(to right, #22d3ee, #a855f7)"
              }}
            >
              {viewMode === "list" || viewMode === "password" ? "Workouts" : selectedWorkout?.name}
            </h1>
            <p className="text-gray-500 text-sm">
              {viewMode === "list" || viewMode === "password" ? "Push • Pull • Legs" : selectedWorkout?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin toggle */}
          <button
            onClick={() => {
              if (isAdmin) {
                setIsAdmin(false);
              } else {
                setViewMode("password");
                setPinDigits([0, 0, 0, 0]);
                setPinIndex(0);
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
              isAdmin
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-gray-900/60 border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
            <span className="text-sm">{isAdmin ? "Admin" : "Locked"}</span>
          </button>

          {viewMode === "detail" && selectedWorkout && (
            <>
              {isAdmin && (
                <button
                  onClick={() => {
                    setViewMode("addExercise");
                    setNewExercise({ name: "", sets: 3, reps: 10, weight: undefined, restSeconds: 60 });
                  }}
                  className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-full px-4 py-2 hover:bg-cyan-500/30 transition-colors"
                >
                  <Plus size={16} />
                  <span className="text-sm">Add</span>
                </button>
              )}
              <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800 rounded-full px-4 py-2 backdrop-blur-sm">
                <Timer size={16} style={{ color: selectedWorkout.color }} />
                <span className="text-sm text-gray-300">{selectedWorkout.estimatedMinutes} min</span>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(viewMode === "list" || viewMode === "password") ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full relative z-10"
          >
            {workouts.map((workout, index) => {
              const isFocused = index === focusedWorkoutIndex;
              return (
                <motion.div
                  key={workout.id}
                  className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-200 cursor-pointer
                    ${isFocused
                      ? "bg-gray-900/80 scale-[1.02]"
                      : "bg-gray-900/40 border-gray-800/50 opacity-60 hover:opacity-80"
                    }
                  `}
                  style={{
                    borderColor: isFocused ? `${workout.color}50` : undefined,
                    boxShadow: isFocused ? `0 0 30px ${workout.color}20` : undefined,
                  }}
                  onClick={() => {
                    setFocusedWorkoutIndex(index);
                    setViewMode("detail");
                    setFocusedExerciseIndex(0);
                  }}
                >
                  {isFocused && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: `linear-gradient(to bottom, ${workout.color}15, transparent)` }}
                    />
                  )}

                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${workout.color}20` }}
                      >
                        <Dumbbell size={20} style={{ color: workout.color }} />
                      </div>
                      <h3 className={`text-lg font-semibold ${isFocused ? "text-white" : "text-gray-400"}`}>
                        {workout.name}
                      </h3>
                    </div>
                    <ChevronRight style={{ color: isFocused ? workout.color : "#374151" }} size={20} />
                  </div>

                  <div className="flex gap-4 mb-3 text-xs text-gray-500 relative z-10">
                    <div className="flex items-center gap-1">
                      <Timer size={12} />
                      <span>{workout.estimatedMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{workout.exercises.length} exercises</span>
                    </div>
                  </div>

                  <div className="space-y-1 relative z-10">
                    {workout.exercises.slice(0, 3).map((ex, i) => (
                      <div key={i} className="text-xs text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `${workout.color}80` }} />
                        <span className="capitalize">{ex.name}</span>
                      </div>
                    ))}
                    {workout.exercises.length > 3 && (
                      <div className="text-xs text-gray-600 pl-3">+ {workout.exercises.length - 3} more</div>
                    )}
                  </div>

                  {isFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-3 right-3 text-[10px] font-medium flex items-center gap-1.5 px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${workout.color}15`,
                        borderColor: `${workout.color}30`,
                        color: workout.color,
                        border: "1px solid"
                      }}
                    >
                      <kbd className="text-blue-400">✕</kbd>
                      View
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : viewMode === "detail" || viewMode === "addExercise" ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full relative z-10"
          >
            {/* Exercise List */}
            <div className="lg:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {selectedWorkout?.exercises.map((exercise, index) => {
                const isFocused = index === focusedExerciseIndex;
                return (
                  <motion.div
                    key={exercise.id}
                    className={`p-4 rounded-xl border cursor-pointer relative transition-all duration-200
                      ${isFocused
                        ? "bg-gray-900/80 scale-[1.02]"
                        : "bg-gray-900/40 border-gray-800/50 opacity-50 hover:opacity-70"
                      }
                    `}
                    style={{
                      borderColor: isFocused ? `${selectedWorkout.color}50` : undefined,
                    }}
                    onClick={() => setFocusedExerciseIndex(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm capitalize ${isFocused ? "text-white" : "text-gray-400"}`}>
                          {exercise.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {exercise.weight && (
                          <div
                            className="text-sm font-mono"
                            style={{ color: isFocused ? selectedWorkout.color : "#4b5563" }}
                          >
                            {Math.round(exercise.weight / 2.205)} kg
                          </div>
                        )}
                        {isFocused && isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(index);
                            }}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {isFocused && (
                      <motion.div
                        layoutId="exercise-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                        style={{ backgroundColor: selectedWorkout.color }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Exercise Detail */}
            <div className="lg:col-span-2 bg-gray-900/40 rounded-2xl border border-gray-800/50 p-6 backdrop-blur-sm relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedExercise && (
                  <motion.div
                    key={selectedExercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full flex flex-col"
                  >
                    {/* Exercise Image */}
                    <div className="relative w-full h-48 md:h-64 rounded-xl mb-6 flex items-center justify-center overflow-hidden border border-gray-800/50 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />

                      {exerciseData.get(selectedExercise.name)?.image ? (
                        <img
                          src={exerciseData.get(selectedExercise.name)?.image || ""}
                          alt={selectedExercise.name}
                          className="h-full object-contain relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                        />
                      ) : (
                        <div className="text-center relative z-10">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                            style={{ backgroundColor: `${selectedWorkout.color}20` }}
                          >
                            <Dumbbell size={32} style={{ color: selectedWorkout.color }} />
                          </div>
                          <p className="text-gray-500 text-sm">Loading image...</p>
                        </div>
                      )}
                    </div>

                    {/* Exercise Name */}
                    <h2 className="text-2xl font-bold capitalize mb-4 text-white">
                      {selectedExercise.name}
                    </h2>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50 text-center">
                        <div className="text-3xl font-bold" style={{ color: selectedWorkout.color }}>{selectedExercise.sets}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Sets</div>
                      </div>
                      <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50 text-center">
                        <div className="text-3xl font-bold text-purple-400">{selectedExercise.reps}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Reps</div>
                      </div>
                      <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50 text-center">
                        <div className="text-3xl font-bold text-amber-400">
                          {selectedExercise.weight ? Math.round(selectedExercise.weight / 2.205) : "—"}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">kg</div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex gap-4 text-sm">
                      {selectedExercise.restSeconds && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <RotateCcw size={16} style={{ color: selectedWorkout.color }} />
                          <span>{selectedExercise.restSeconds}s rest</span>
                        </div>
                      )}
                      {exerciseData.get(selectedExercise.name)?.category && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Weight size={16} className="text-purple-500" />
                          <span className="capitalize">
                            {exerciseData.get(selectedExercise.name)?.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: selectedWorkout?.color }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Controller hints */}
      <div className="flex justify-center mt-8 relative z-10">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-cyan-400 font-mono text-[10px]">
              {viewMode === "list" ? "←→" : "↑↓"}
            </kbd>
            Navigate
          </span>
          {viewMode === "list" ? (
            <>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-blue-400 font-mono text-[10px]">
                  ✕
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-red-400 font-mono text-[10px]">
                  ○
                </kbd>
                Back
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-amber-400 font-mono text-[10px]">
                  L1/R1
                </kbd>
                {isAdmin ? "Lock" : "Admin"}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-red-400 font-mono text-[10px]">
                  ○
                </kbd>
                Back
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-amber-400 font-mono text-[10px]">
                  L1/R1
                </kbd>
                {isAdmin ? "Lock" : "Admin"}
              </span>
              {isAdmin && (
                <>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-green-400 font-mono text-[10px]">
                      △
                    </kbd>
                    Add
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-pink-400 font-mono text-[10px]">
                      □
                    </kbd>
                    Delete
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
