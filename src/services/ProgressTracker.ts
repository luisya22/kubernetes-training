import * as fs from 'fs';
import * as path from 'path';
import { Progress, DifficultyLevel, SerializableProgress, serializeProgress, deserializeProgress, Lesson, Exercise } from '../types';

// Helper to get the correct data directory
function getDataDirectory(): string {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).require) {
    try {
      const { app } = (window as any).require('electron').remote || (window as any).require('@electron/remote');
      if (app) {
        return path.join(app.getPath('userData'), 'data');
      }
    } catch (e) {
      // If remote is not available, try to get it from electron
      try {
        const electron = (window as any).require('electron');
        if (electron.app) {
          return path.join(electron.app.getPath('userData'), 'data');
        }
      } catch (e2) {
        console.warn('Could not access electron app, using fallback path');
      }
    }
  }
  
  // Fallback for development or non-Electron environments
  return path.join(process.cwd(), 'data');
}

export class ProgressTracker {
  private progress: Progress;
  private progressFilePath: string;
  private contentManager: any; // Will be injected to access lessons/exercises

  constructor(progressFilePath?: string, contentManager?: any) {
    this.progressFilePath = progressFilePath || path.join(getDataDirectory(), 'progress.json');
    this.contentManager = contentManager;
    console.log('ProgressTracker initialized with path:', this.progressFilePath);
    this.progress = this.loadProgress();
  }

  private loadProgress(): Progress {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.progressFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Load progress from file if it exists
      if (fs.existsSync(this.progressFilePath)) {
        const data = fs.readFileSync(this.progressFilePath, 'utf-8');
        const serializable: SerializableProgress = JSON.parse(data);
        console.log('Progress loaded from:', this.progressFilePath);
        return deserializeProgress(serializable);
      } else {
        console.log('No existing progress file found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      console.error('Attempted to load from:', this.progressFilePath);
    }

    // Return default progress if file doesn't exist or error occurred
    return {
      completedLessons: [],
      completedExercises: [],
      currentLevel: 'beginner',
      timestamps: new Map()
    };
  }

  private saveProgress(): void {
    try {
      const dir = path.dirname(this.progressFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const serializable = serializeProgress(this.progress);
      const jsonData = JSON.stringify(serializable, null, 2);
      fs.writeFileSync(this.progressFilePath, jsonData, 'utf-8');
      console.log('Progress saved successfully to:', this.progressFilePath);
    } catch (error) {
      console.error('Error saving progress:', error);
      console.error('Attempted to save to:', this.progressFilePath);
    }
  }

  recordCompletion(itemId: string, itemType: 'lesson' | 'exercise'): void {
    const timestamp = new Date();

    if (itemType === 'lesson') {
      if (!this.progress.completedLessons.includes(itemId)) {
        this.progress.completedLessons.push(itemId);
        this.progress.timestamps.set(itemId, timestamp);
      }
    } else if (itemType === 'exercise') {
      if (!this.progress.completedExercises.includes(itemId)) {
        this.progress.completedExercises.push(itemId);
        this.progress.timestamps.set(itemId, timestamp);
      }
    }

    // Update current level based on completions
    this.updateCurrentLevel();

    this.saveProgress();
  }

  private updateCurrentLevel(): void {
    if (!this.contentManager) {
      return;
    }

    // Check if all beginner exercises are complete
    const beginnerLessons = this.contentManager.getLessons('beginner');
    const beginnerExerciseIds = new Set<string>();
    
    for (const lesson of beginnerLessons) {
      const exercises = this.contentManager.getExercisesByLesson(lesson.id);
      exercises.forEach((ex: Exercise) => beginnerExerciseIds.add(ex.id));
    }

    const allBeginnerComplete = Array.from(beginnerExerciseIds).every(
      id => this.progress.completedExercises.includes(id)
    );

    if (allBeginnerComplete && beginnerExerciseIds.size > 0) {
      // Check if all intermediate exercises are complete
      const intermediateLessons = this.contentManager.getLessons('intermediate');
      const intermediateExerciseIds = new Set<string>();
      
      for (const lesson of intermediateLessons) {
        const exercises = this.contentManager.getExercisesByLesson(lesson.id);
        exercises.forEach((ex: Exercise) => intermediateExerciseIds.add(ex.id));
      }

      const allIntermediateComplete = Array.from(intermediateExerciseIds).every(
        id => this.progress.completedExercises.includes(id)
      );

      if (allIntermediateComplete && intermediateExerciseIds.size > 0) {
        this.progress.currentLevel = 'advanced';
      } else {
        this.progress.currentLevel = 'intermediate';
      }
    } else {
      this.progress.currentLevel = 'beginner';
    }
  }

  getProgress(): Progress {
    return {
      completedLessons: [...this.progress.completedLessons],
      completedExercises: [...this.progress.completedExercises],
      currentLevel: this.progress.currentLevel,
      timestamps: new Map(this.progress.timestamps)
    };
  }

  isUnlocked(itemId: string): boolean {
    if (!this.contentManager) {
      // If no content manager, assume everything is unlocked
      return true;
    }

    // Check if it's a lesson
    const lesson = this.contentManager.getLesson(itemId);
    if (lesson) {
      // Lessons are unlocked based on current level
      const levelOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
      const currentLevelIndex = levelOrder.indexOf(this.progress.currentLevel);
      const lessonLevelIndex = levelOrder.indexOf(lesson.level);
      return lessonLevelIndex <= currentLevelIndex;
    }

    // Check if it's an exercise
    const exercise = this.contentManager.getExercise(itemId);
    if (exercise) {
      // Exercise is unlocked if its lesson is completed
      return this.progress.completedLessons.includes(exercise.lessonId);
    }

    // Unknown item, assume unlocked
    return true;
  }

  resetProgress(scope: 'all' | 'exercise', itemId?: string): void {
    if (scope === 'exercise' && itemId) {
      // Reset specific exercise
      const index = this.progress.completedExercises.indexOf(itemId);
      if (index !== -1) {
        this.progress.completedExercises.splice(index, 1);
        this.progress.timestamps.delete(itemId);
      }
    } else if (scope === 'all') {
      // Reset all progress
      this.progress.completedLessons = [];
      this.progress.completedExercises = [];
      this.progress.currentLevel = 'beginner';
      this.progress.timestamps.clear();
    }

    this.saveProgress();
  }
}
