export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  level: DifficultyLevel;
  order: number;
  content: string;
  concepts: string[];
  exercises: string[];
}

export interface Exercise {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  steps: ExerciseStep[];
  validationCriteria: ValidationCriteria[];
  resources?: ExerciseResource[];
}

export interface ExerciseStep {
  id: string;
  instruction: string;
  expectedOutcome: string;
  hints: string[];
}

export interface ValidationCriteria {
  type: 'kubernetes' | 'docker' | 'http' | 'custom';
  checks: ValidationCheck[];
}

export interface ValidationCheck {
  command?: string;
  expectedOutput?: string;
  httpRequest?: HttpRequestSpec;
  customValidator?: (context: any) => Promise<boolean>;
}

export interface HttpRequestSpec {
  url: string;
  method: string;
  expectedStatus: number;
  expectedBody?: any;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  details: string[];
  suggestions: string[];
}

export interface Progress {
  completedLessons: string[];
  completedExercises: string[];
  currentLevel: DifficultyLevel;
  timestamps: Map<string, Date>;
}

// Serializable version of Progress for JSON storage
export interface SerializableProgress {
  completedLessons: string[];
  completedExercises: string[];
  currentLevel: DifficultyLevel;
  timestamps: Record<string, string>; // ISO date strings
}

// Serialization helpers for Progress
export function serializeProgress(progress: Progress): SerializableProgress {
  const timestamps: Record<string, string> = {};
  progress.timestamps.forEach((date, key) => {
    timestamps[key] = date.toISOString();
  });
  
  return {
    completedLessons: [...progress.completedLessons],
    completedExercises: [...progress.completedExercises],
    currentLevel: progress.currentLevel,
    timestamps
  };
}

export function deserializeProgress(data: SerializableProgress): Progress {
  const timestamps = new Map<string, Date>();
  Object.entries(data.timestamps).forEach(([key, dateStr]) => {
    timestamps.set(key, new Date(dateStr));
  });
  
  return {
    completedLessons: [...data.completedLessons],
    completedExercises: [...data.completedExercises],
    currentLevel: data.currentLevel,
    timestamps
  };
}

export interface Microservice {
  id: string;
  name: string;
  language: string;
  sourceCode: string;
  dockerfile: string;
  manifests: string[];
}

export interface BuildResult {
  success: boolean;
  imageId: string;
  output: string[];
}

export interface ImageInfo {
  id: string;
  tags: string[];
  size: number;
  created: Date;
}

export interface ExpectedResponse {
  statusCode: number;
  body?: any;
  headers?: Record<string, string>;
}

// Lesson content structure
export interface LessonContent {
  id: string;
  title: string;
  level: DifficultyLevel;
  order: number;
  concepts: string[];
  content: {
    introduction: string;
    sections: ContentSection[];
    summary: string;
  };
  exercises: string[];
  prerequisites: string[];
}

export interface ContentSection {
  title: string;
  content: string;
  codeExamples?: CodeExample[];
  diagrams?: string[];
}

export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
}

// Exercise definition structure
export interface ExerciseDefinition {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedTime: number;
  steps: ExerciseStepDefinition[];
  resources: ExerciseResource[];
}

export interface ExerciseStepDefinition {
  id: string;
  order: number;
  instruction: string;
  expectedOutcome: string;
  hints: string[];
  validation: ValidationCriteria;
}

export interface ExerciseResource {
  type: 'microservice' | 'yaml' | 'dockerfile' | 'info' | 'commands';
  name: string;
  content: string;
  path?: string;
}

// Application configuration
export interface AppConfig {
  kubernetesContext?: string;
  dockerHost?: string;
  validationTimeout: number;
  debugMode: boolean;
  theme: 'light' | 'dark';
}

// Serializable version of AppConfig for JSON storage
export interface SerializableAppConfig extends AppConfig {}

export function serializeAppConfig(config: AppConfig): SerializableAppConfig {
  return { ...config };
}

export function deserializeAppConfig(data: SerializableAppConfig): AppConfig {
  return { ...data };
}
