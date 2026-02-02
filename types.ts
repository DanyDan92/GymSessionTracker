
export enum TrackingType {
  REPS = 'repetitions',
  DURATION = 'duration',
}

export interface Tempo {
  eccentric: number;
  pause: number;
  concentric: number;
}

// Stored in the library, the "master" definition
export interface ExerciseTemplate {
  id: string;
  name: string;
  defaultSets: number;
  defaultTrackingType: TrackingType;
  defaultTargetReps?: number;
  defaultTargetDuration?: number; // in seconds
  defaultRestTime: number; // in seconds
  defaultRpe: number;
  defaultTempo: Tempo;
  defaultWeight?: number;
  imageUrl?: string;
  videoUrl?: string;
}

// Tracks the completion of a single set
export interface SetProgress {
  setNumber: number;
  repsDone?: number;
  durationDone?: number; // in seconds
  actualRpe: number;
  weight?: number;
}

// An exercise instance within a specific workout session
export interface SessionExercise {
  id: string; // Unique instance ID
  templateId: string;
  name: string;
  sets: number;
  trackingType: TrackingType;
  targetReps?: number;
  targetDuration?: number; // in seconds
  restTime: number; // in seconds
  targetRpe: number;
  tempo: Tempo;
  targetWeight?: number;
  setsProgress: SetProgress[];
  imageUrl?: string;
  videoUrl?: string;
}


export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  notes?: string;
  exercises: SessionExercise[];
  isCompleted: boolean;
}
