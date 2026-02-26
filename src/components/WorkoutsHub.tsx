"use client";

import { useInput } from "@/lib/gamepad";
import BackButton from "@/components/BackButton";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Timer, ChevronRight, Weight, RotateCcw, Plus, X, Edit2, Trash2 } from "lucide-react";
import workoutsData from "@/data/workouts.json";
import type { Workout, Exercise } from "@/types/workout";
import { searchExercise, type WgerExercise } from "@/lib/exercisedb";

type ViewMode = "list" | "detail" | "addExercise" | "editWorkout";

const STORAGE_KEY = "drift-hub-workouts";

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
  const { input, vibrate } = useInput();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [focusedWorkoutIndex, setFocusedWorkoutIndex] = useState(0);
  const [focusedExerciseIndex, setFocusedExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState<Map<string, WgerExercise | null>>(new Map());
  const lastInputTime = useRef(0);
  const INPUT_DELAY = 150;

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

  useEffect(() => {
    if (!input) return;

    const now = Date.now();
    if (now - lastInputTime.current < INPUT_DELAY) return;

    const { buttons, axes } = input;

    // Navigation
    let direction = 0;
    if (buttons[12] || axes[1] < -0.5) direction = -1; // Up
    if (buttons[13] || axes[1] > 0.5) direction = 1; // Down

    if (direction !== 0) {
      if (viewMode === "list") {
        setFocusedWorkoutIndex((prev) => {
          let next = prev + direction;
          if (next < 0) next = workouts.length - 1;
          if (next >= workouts.length) next = 0;
          return next;
        });
      } else {
        setFocusedExerciseIndex((prev) => {
          const exercises = workouts[focusedWorkoutIndex].exercises;
          let next = prev + direction;
          if (next < 0) next = exercises.length - 1;
          if (next >= exercises.length) next = 0;
          return next;
        });
      }
      vibrate(30, 0.3, 0);
      lastInputTime.current = now;
    }

    // Select (✕ button) - Enter workout detail
    if (buttons[0] && viewMode === "list" && now - lastInputTime.current > 300) {
      setViewMode("detail");
      setFocusedExerciseIndex(0);
      vibrate(100, 1.0, 1.0);
      lastInputTime.current = now;
    }

    // Back (◯ button) - Go back to list or close modal
    if (buttons[1] && now - lastInputTime.current > 300) {
      if (viewMode === "addExercise") {
        setViewMode("detail");
      } else if (viewMode === "detail") {
        setViewMode("list");
      }
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }

    // Triangle button (button 3) - Add exercise when in detail view
    if (buttons[3] && viewMode === "detail" && now - lastInputTime.current > 300) {
      setViewMode("addExercise");
      setNewExercise({ name: "", sets: 3, reps: 10, weight: undefined, restSeconds: 60 });
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }

    // Square button (button 2) - Delete exercise when in detail view
    if (buttons[2] && viewMode === "detail" && selectedExercise && now - lastInputTime.current > 300) {
      handleDeleteExercise(focusedExerciseIndex);
      vibrate(50, 0.5, 0);
      lastInputTime.current = now;
    }
  }, [input, viewMode, focusedWorkoutIndex, workouts, vibrate, focusedExerciseIndex, selectedExercise]);

  const handleAddExercise = () => {
    if (!newExercise.name) return;

    const exercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExercise.name,
      sets: newExercise.sets || 3,
      reps: newExercise.reps || 10,
      weight: newExercise.weight ? Math.round(newExercise.weight * 2.205) : undefined, // Convert kg to lbs for storage
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Dumbbell size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {viewMode === "list" ? "Workouts" : selectedWorkout.name}
            </h1>
            <p className="text-gray-500 text-sm">
              {viewMode === "list" ? "Select a workout" : selectedWorkout.description}
            </p>
          </div>
        </div>

        {(viewMode === "detail" || viewMode === "addExercise") && selectedWorkout && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("addExercise")}
              className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-full px-4 py-2 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm">Add Exercise</span>
            </button>
            <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800 rounded-full px-4 py-2 backdrop-blur-sm">
              <Timer size={16} className="text-cyan-400" />
              <span className="text-sm text-gray-300">{selectedWorkout.estimatedMinutes} min</span>
            </div>
          </div>
        )}
      </div>

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

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto w-full relative z-10"
          >
            {workouts.map((workout, index) => {
              const isFocused = index === focusedWorkoutIndex;
              return (
                <motion.div
                  key={workout.id}
                  className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-200 cursor-pointer
                    ${isFocused
                      ? "bg-gray-900/80 border-cyan-500/50 scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                      : "bg-gray-900/40 border-gray-800/50 opacity-60 hover:opacity-80"
                    }
                  `}
                  onClick={() => {
                    setFocusedWorkoutIndex(index);
                    setViewMode("detail");
                    setFocusedExerciseIndex(0);
                  }}
                >
                  {isFocused && (
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
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
                    <ChevronRight className={`${isFocused ? "text-cyan-400" : "text-gray-700"}`} size={20} />
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
                        <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                        {ex.name}
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
                      className="absolute bottom-3 right-3 text-[10px] font-medium text-cyan-400 flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full"
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
                        ? "bg-gray-900/80 border-cyan-500/50 scale-[1.02]"
                        : "bg-gray-900/40 border-gray-800/50 opacity-50 hover:opacity-70"
                      }
                    `}
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
                          <div className={`text-sm font-mono ${isFocused ? "text-cyan-400" : "text-gray-600"}`}>
                            {Math.round(exercise.weight / 2.205)} kg
                          </div>
                        )}
                        {isFocused && (
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
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-l-xl"
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
                    <div className="relative w-full h-48 md:h-64 bg-gray-950/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden border border-gray-800/50">
                      {exerciseData.get(selectedExercise.name)?.image ? (
                        <img
                          src={exerciseData.get(selectedExercise.name)?.image || ""}
                          alt={selectedExercise.name}
                          className="h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <Dumbbell size={48} className="text-gray-700 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">Loading image...</p>
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
                        <div className="text-3xl font-bold text-cyan-400">{selectedExercise.sets}</div>
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
                          <RotateCcw size={16} className="text-cyan-500" />
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

                    {/* Notes */}
                    {selectedExercise.notes && (
                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-300">{selectedExercise.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Controller hints */}
      <div className="flex justify-center mt-8 relative z-10">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-cyan-400 font-mono text-[10px]">
              ↑↓
            </kbd>
            Navigate
          </span>
          {viewMode === "list" ? (
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-blue-400 font-mono text-[10px]">
                ✕
              </kbd>
              View
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-red-400 font-mono text-[10px]">
                  ◯
                </kbd>
                Back
              </span>
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
        </div>
      </div>
    </div>
  );
}
