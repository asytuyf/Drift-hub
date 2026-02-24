export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds?: number;
  notes?: string;
  // ExerciseDB fields (populated from API)
  gifUrl?: string;
  bodyPart?: string;
  equipment?: string;
  target?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  estimatedMinutes?: number;
  color?: string;
}
