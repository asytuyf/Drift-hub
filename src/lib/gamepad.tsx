"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";

// Define the shape of our input state
export interface InputState {
  connected: boolean;
  buttons: boolean[]; // Array of button pressed states (true/false)
  axes: number[];     // Array of axis values (-1 to 1)
  timestamp: number;
  source: "gamepad" | "keyboard" | "virtual" | "mixed";
}

interface InputContextType {
  input: InputState | null;
  vibrate: (duration: number, weak?: number, strong?: number) => void;
  simulateButton: (index: number, pressed: boolean) => void;
}

const InputContext = createContext<InputContextType | undefined>(undefined);

// Initial state
const BUTTON_COUNT = 17;
const AXIS_COUNT = 4;

export function InputProvider({ children }: { children: ReactNode }) {
  // We use refs for the "live" state to avoid re-rendering the provider constantly
  // and to avoid stale closures in event listeners.
  const virtualState = useRef({
    buttons: new Array(BUTTON_COUNT).fill(false),
    axes: new Array(AXIS_COUNT).fill(0),
    timestamp: 0,
    active: false
  });

  const gamepadState = useRef({
    buttons: new Array(BUTTON_COUNT).fill(false),
    axes: new Array(AXIS_COUNT).fill(0),
    timestamp: 0,
    connected: false
  });

  // The exposed state that consumers react to
  const [inputState, setInputState] = useState<InputState | null>(null);
  
  // Helper to deep compare states to prevent React render thrashing
  const prevStateRef = useRef<InputState | null>(null);

  // Keyboard Handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      const v = virtualState.current;
      let changed = false;

      // Helper to set button
      const setBtn = (idx: number) => {
        if (v.buttons[idx] !== isDown) {
          v.buttons[idx] = isDown;
          changed = true;
        }
      };

      // Helper to set axis
      const setAxis = (idx: number, val: number) => {
        if (v.axes[idx] !== val) {
          v.axes[idx] = val;
          changed = true;
        }
      };

      switch (e.key) {
        case "ArrowUp": case "w": case "W": 
          setBtn(12); setAxis(1, isDown ? -1 : 0); break;
        case "ArrowDown": case "s": case "S": 
          setBtn(13); setAxis(1, isDown ? 1 : 0); break;
        case "ArrowLeft": case "a": case "A": 
          setBtn(14); setAxis(0, isDown ? -1 : 0); break;
        case "ArrowRight": case "d": case "D": 
          setBtn(15); setAxis(0, isDown ? 1 : 0); break;
        case "Enter": case " ": setBtn(0); break; // Cross
        case "Escape": case "Backspace": setBtn(1); break; // Circle
        case "e": case "E": setBtn(2); break; // Square
        case "q": case "Q": setBtn(3); break; // Triangle
      }

      if (changed) {
        v.timestamp = Date.now();
        v.active = true;
      }
    };

    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Main Loop - Polling & Merging
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      const now = Date.now();
      
      // 1. Poll Gamepad
      const gamepads = navigator.getGamepads();
      const pad = gamepads[0];
      const g = gamepadState.current;

      if (pad) {
        g.connected = true;
        g.timestamp = pad.timestamp;
        
        // Update generic arrays
        for (let i = 0; i < BUTTON_COUNT; i++) {
          if (pad.buttons[i]) g.buttons[i] = pad.buttons[i].pressed;
        }
        for (let i = 0; i < AXIS_COUNT; i++) {
          if (pad.axes[i]) g.axes[i] = pad.axes[i];
        }
      } else {
        g.connected = false;
      }

      // 2. Merge States (OR logic)
      // If either Virtual OR Gamepad is pressing a button, it's pressed.
      const v = virtualState.current;
      
      const mergedButtons = new Array(BUTTON_COUNT).fill(false);
      const mergedAxes = new Array(AXIS_COUNT).fill(0);

      const isGamePadActive = g.connected && (g.buttons.some(b => b) || g.axes.some(a => Math.abs(a) > 0.1));
      const isVirtualActive = v.active && (v.buttons.some(b => b) || v.axes.some(a => Math.abs(a) > 0.1));

      // Simple merge: logical OR
      for (let i = 0; i < BUTTON_COUNT; i++) {
        mergedButtons[i] = g.buttons[i] || v.buttons[i];
      }
      for (let i = 0; i < AXIS_COUNT; i++) {
        // For axes, we take the one with larger magnitude
        const gAxis = g.axes[i];
        const vAxis = v.axes[i];
        mergedAxes[i] = Math.abs(gAxis) > Math.abs(vAxis) ? gAxis : vAxis;
      }

      // 3. Determine Source
      let source: InputState["source"] = "keyboard"; // Default
      if (isGamePadActive && isVirtualActive) source = "mixed";
      else if (isGamePadActive) source = "gamepad";
      else if (v.active) source = "virtual"; // Covers keyboard/mouse

      // 4. Update React State if changed
      const currentSnapshot: InputState = {
        connected: g.connected || v.active, // "Connected" if any input is working
        buttons: mergedButtons,
        axes: mergedAxes,
        timestamp: now,
        source
      };

      const prev = prevStateRef.current;
      const hasChanged = !prev ||
        prev.source !== source ||
        prev.buttons.some((b, i) => b !== mergedButtons[i]) ||
        prev.axes.some((a, i) => Math.abs(a - mergedAxes[i]) > 0.01);

      if (hasChanged) {
        prevStateRef.current = currentSnapshot;
        setInputState(currentSnapshot);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const vibrate = useCallback((duration: number, weak = 1.0, strong = 1.0) => {
    // Try browser API
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(duration);
    }
    // Try Gamepad API
    const gamepads = navigator.getGamepads();
    const pad = gamepads[0];
    if (pad && pad.vibrationActuator) {
      // vibrationActuator types are now better handled
      pad.vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration: duration,
        weakMagnitude: weak,
        strongMagnitude: strong,
      });
    }
  }, []);

  const simulateButton = useCallback((index: number, pressed: boolean) => {
    const v = virtualState.current;
    if (v.buttons[index] !== pressed) {
      v.buttons[index] = pressed;
      v.active = true;
      v.timestamp = Date.now();
    }
  }, []);

  return (
    <InputContext.Provider value={{ input: inputState, vibrate, simulateButton }}>
      {children}
    </InputContext.Provider>
  );
}

export function useInput() {
  const context = useContext(InputContext);
  if (context === undefined) {
    throw new Error("useInput must be used within a InputProvider");
  }
  return context;
}

// Backward compatibility alias
export const useGamepad = () => {
  const context = useInput();
  return { ...context, gamepad: context.input };
};

export const GamepadProvider = InputProvider;
