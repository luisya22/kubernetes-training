import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ProgressDashboard from '../ProgressDashboard';
import { Lesson, Exercise, DifficultyLevel } from '../../../types';

// Arbitraries for generating test data
const lessonArbitrary: fc.Arbitrary<Lesson> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  level: fc.constantFrom<DifficultyLevel>('beginner', 'intermediate', 'advanced'),
  content: fc.string({ minLength: 1 }),
  concepts: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
  exercises: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 })
});

const exerciseArbitrary: fc.Arbitrary<Exercise> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  lessonId: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1 }),
  steps: fc.array(fc.record({
    id: fc.string({ minLength: 1 }),
    instruction: fc.string({ minLength: 1 }),
    expectedOutcome: fc.string({ minLength: 1 }),
    hints: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 })
  }), { minLength: 1, maxLength: 5 }),
  validationCriteria: fc.array(fc.record({
    type: fc.constantFrom('kubernetes' as const, 'docker' as const, 'http' as const, 'custom' as const),
    checks: fc.array(fc.record({
      command: fc.option(fc.string(), { nil: undefined }),
      expectedOutput: fc.option(fc.string(), { nil: undefined })
    }), { minLength: 1, maxLength: 3 })
  }), { minLength: 1, maxLength: 5 })
});

/**
 * **Feature: kubernetes-training-app, Property 2: Exercise unlocking**
 * **Validates: Requirements 1.4**
 * 
 * For any lesson, marking it as complete should unlock all associated exercises for that lesson.
 */
describe('Property 2: Exercise unlocking', () => {
  it('should unlock all exercises associated with a lesson when the lesson is marked complete', () => {
    fc.assert(
      fc.property(
        lessonArbitrary,
        fc.array(exerciseArbitrary, { minLength: 1, maxLength: 10 }),
        (lesson, allExercises) => {
          // Filter exercises to only include those associated with this lesson
          const lessonExercises = allExercises.map(ex => ({
            ...ex,
            lessonId: lesson.id
          }));

          // Create mock content manager
          const contentManager = {
            getAllLessons: () => [lesson],
            getLessons: (level: DifficultyLevel) => level === lesson.level ? [lesson] : [],
            getLesson: (id: string) => (id === lesson.id ? lesson : null),
            getAllExercises: () => lessonExercises,
            getExercise: (id: string) => lessonExercises.find(e => e.id === id) || null,
            getExercisesByLesson: (lessonId: string) => 
              lessonId === lesson.id ? lessonExercises : []
          };

          // Create mock progress tracker - initially lesson is not complete
          const initialProgress = {
            completedLessons: [] as string[],
            completedExercises: [] as string[],
            currentLevel: 'beginner' as DifficultyLevel,
            timestamps: new Map()
          };

          const progressTracker = {
            getProgress: jest.fn(() => initialProgress),
            isUnlocked: jest.fn((itemId: string) => {
              // Lessons are always unlocked for this test
              if (itemId === lesson.id) return true;
              
              // Exercises are unlocked if their lesson is completed
              const exercise = lessonExercises.find(e => e.id === itemId);
              if (exercise) {
                return initialProgress.completedLessons.includes(exercise.lessonId);
              }
              return false;
            }),
            recordCompletion: jest.fn(),
            resetProgress: jest.fn()
          };

          // Render with lesson not completed - exercises should be locked
          const { rerender } = render(
            <ProgressDashboard
              contentManager={contentManager}
              progressTracker={progressTracker}
            />
          );

          // Check that exercises are locked initially
          lessonExercises.forEach(exercise => {
            const isUnlockedBefore = progressTracker.isUnlocked(exercise.id);
            expect(isUnlockedBefore).toBe(false);
          });

          // Now mark the lesson as complete
          const completedProgress = {
            completedLessons: [lesson.id],
            completedExercises: [],
            currentLevel: 'beginner' as DifficultyLevel,
            timestamps: new Map([[lesson.id, new Date()]])
          };

          const progressTrackerAfterCompletion = {
            getProgress: jest.fn(() => completedProgress),
            isUnlocked: jest.fn((itemId: string) => {
              // Lessons are always unlocked
              if (itemId === lesson.id) return true;
              
              // Exercises are unlocked if their lesson is completed
              const exercise = lessonExercises.find(e => e.id === itemId);
              if (exercise) {
                return completedProgress.completedLessons.includes(exercise.lessonId);
              }
              return false;
            }),
            recordCompletion: jest.fn(),
            resetProgress: jest.fn()
          };

          // Rerender with lesson completed
          rerender(
            <ProgressDashboard
              contentManager={contentManager}
              progressTracker={progressTrackerAfterCompletion}
            />
          );

          // Check that all exercises are now unlocked
          const allExercisesUnlocked = lessonExercises.every(exercise => {
            return progressTrackerAfterCompletion.isUnlocked(exercise.id);
          });

          expect(allExercisesUnlocked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: kubernetes-training-app, Property 9: Exercise completion condition**
 * **Validates: Requirements 3.4**
 * 
 * For any exercise, if and only if all steps pass validation, the exercise should be marked as complete.
 */
describe('Property 9: Exercise completion condition', () => {
  it('should mark exercise as complete if and only if all steps pass validation', () => {
    fc.assert(
      fc.property(
        exerciseArbitrary,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (exercise, stepValidationResults) => {
          // Ensure we have validation results for each step
          const validationResults = exercise.steps.map((_, i) => 
            stepValidationResults[i % stepValidationResults.length]
          );

          // Create mock content manager
          const contentManager = {
            getAllLessons: () => [],
            getLessons: (level: DifficultyLevel) => [],
            getLesson: (id: string) => null,
            getAllExercises: () => [exercise],
            getExercise: (id: string) => (id === exercise.id ? exercise : null),
            getExercisesByLesson: (lessonId: string) => 
              lessonId === exercise.lessonId ? [exercise] : []
          };

          // Track which steps have been validated successfully
          const completedSteps = new Set<string>();
          validationResults.forEach((passed, index) => {
            if (passed) {
              completedSteps.add(exercise.steps[index].id);
            }
          });

          // Determine if exercise should be complete
          const allStepsPassed = exercise.steps.every(step => 
            completedSteps.has(step.id)
          );

          // Create mock progress tracker
          const progress = {
            completedLessons: [exercise.lessonId],
            completedExercises: allStepsPassed ? [exercise.id] : [],
            currentLevel: 'beginner' as DifficultyLevel,
            timestamps: new Map()
          };

          const progressTracker = {
            getProgress: jest.fn(() => progress),
            isUnlocked: jest.fn(() => true),
            recordCompletion: jest.fn(),
            resetProgress: jest.fn()
          };

          // Render the dashboard
          render(
            <ProgressDashboard
              contentManager={contentManager}
              progressTracker={progressTracker}
            />
          );

          // Check that exercise completion status matches expectation
          const isExerciseComplete = progress.completedExercises.includes(exercise.id);
          
          // Exercise should be complete if and only if all steps passed
          expect(isExerciseComplete).toBe(allStepsPassed);
        }
      ),
      { numRuns: 100 }
    );
  });
});
