"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";

export interface InputState {
  connected: boolean;
  buttons: boolean[];
  axes: number[];
  timestamp: number;
}

interface InputContextType {
  input: InputState | null;
  vibrate: (duration: number, weak?: number, strong?: number) => void;
  simulateButton: (index: number, pressed: boolean) => void;
}

const InputContext = createContext<InputContextType | undefined>(undefined);

const BUTTON_COUNT = 17;
const AXIS_COUNT = 4;

export function InputProvider({ children }: { children: ReactNode }) {
  const gamepadState = useRef({
    buttons: new Array(BUTTON_COUNT).fill(false),
    axes: new Array(AXIS_COUNT).fill(0),
    timestamp: 0,
    connected: false
  });

  const virtualState = useRef({
    buttons: new Array(BUTTON_COUNT).fill(false),
    axes: new Array(AXIS_COUNT).fill(0),
    timestamp: 0,
  });

  const [inputState, setInputState] = useState<InputState | null>(null);
  const prevStateRef = useRef<InputState | null>(null);

  // Gamepad polling loop - NO keyboard support
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      const now = Date.now();

      // Poll Gamepad
      const gamepads = navigator.getGamepads();
      const pad = gamepads[0];
      const g = gamepadState.current;

      if (pad) {
        g.connected = true;
        g.timestamp = pad.timestamp;

        for (let i = 0; i < BUTTON_COUNT; i++) {
          if (pad.buttons[i]) g.buttons[i] = pad.buttons[i].pressed;
        }
        for (let i = 0; i < AXIS_COUNT; i++) {
          if (pad.axes[i] !== undefined) g.axes[i] = pad.axes[i];
        }
      } else {
        g.connected = false;
      }

      // Merge with virtual (for on-screen controller only)
      const v = virtualState.current;
      const mergedButtons = new Array(BUTTON_COUNT).fill(false);
      const mergedAxes = new Array(AXIS_COUNT).fill(0);

      for (let i = 0; i < BUTTON_COUNT; i++) {
        mergedButtons[i] = g.buttons[i] || v.buttons[i];
      }
      for (let i = 0; i < AXIS_COUNT; i++) {
        const gAxis = g.axes[i];
        const vAxis = v.axes[i];
        mergedAxes[i] = Math.abs(gAxis) > Math.abs(vAxis) ? gAxis : vAxis;
      }

      const currentSnapshot: InputState = {
        connected: g.connected,
        buttons: mergedButtons,
        axes: mergedAxes,
        timestamp: now,
      };

      const prev = prevStateRef.current;
      const hasChanged = !prev ||
        prev.connected !== currentSnapshot.connected ||
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
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(duration);
    }
    const gamepads = navigator.getGamepads();
    const pad = gamepads[0];
    if (pad && pad.vibrationActuator) {
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

export const useGamepad = () => {
  const context = useInput();
  return { ...context, gamepad: context.input };
};

export const GamepadProvider = InputProvider;
