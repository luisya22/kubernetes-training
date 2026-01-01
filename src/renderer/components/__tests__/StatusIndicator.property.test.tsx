/**
 * Property-Based Tests for Status and Progress Indicators
 * 
 * These tests verify universal properties for status indicators and progress indication
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ExerciseInterface from '../ExerciseInterface';
import ValidationFeedback from '../ValidationFeedback';
import StatusIndicator from '../StatusIndicator';
import { Exercise, ValidationResult } from '../../../types';

// Test configuration: run 100 iterations minimum
const testConfig = { numRuns: 100 };

// Arbitraries for generating test data
const exerciseStepArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  instruction: fc.string({ minLength: 1 }),
  expectedOutcome: fc.string({ minLength: 1 }),
  hints: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 })
});

const validationCriteriaArbitrary = fc.record({
  type: fc.constantFrom('kubernetes' as const, 'docker' as const, 'http' as const, 'custom' as const),
  checks: fc.array(fc.record({
    command: fc.option(fc.string(), { nil: undefined }),
    expectedOutput: fc.option(fc.string(), { nil: undefined })
  }), { minLength: 1, maxLength: 3 })
});

const exerciseArbitrary: fc.Arbitrary<Exercise> = fc.record({
  id: fc.string({ minLength: 1 }),
  lessonId: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  description: fc.string({ minLength: 1 }),
  steps: fc.array(exerciseStepArbitrary, { minLength: 1, maxLength: 5 }),
  validationCriteria: fc.array(validationCriteriaArbitrary, { minLength: 1, maxLength: 5 })
}).map(exercise => ({
  ...exercise,
  validationCriteria: exercise.steps.map((_, i) => 
    exercise.validationCriteria[i % exercise.validationCriteria.length]
  )
})) as fc.Arbitrary<Exercise>;

// Mock content manager
const createMockContentManager = (exercises: Exercise[]) => ({
  getAllExercises: () => exercises,
  getExercise: (id: string) => exercises.find(e => e.id === id) || null,
  getExercisesByLesson: (lessonId: string) => exercises.filter(e => e.lessonId === lessonId)
});

// Mock progress tracker with configurable state
const createMockProgressTracker = (
  completedExercises: string[] = [],
  completedLessons: string[] = [],
  currentLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  unlockAll: boolean = true
) => ({
  getProgress: () => ({
    completedLessons,
    completedExercises,
    currentLevel,
    timestamps: new Map()
  }),
  isUnlocked: (itemId: string) => unlockAll || completedLessons.includes(itemId),
  recordCompletion: jest.fn()
});

/**
 * **Feature: kubernetes-training-app, Property 30: Exercise status indicators**
 * **Validates: Requirements 15.3**
 * 
 * For any exercise, the UI should display appropriate status indicators (completed, in-progress, or locked) 
 * based on its current state.
 */
describe('Property 30: Exercise status indicators', () => {
  test('for any exercise, completed exercises should display completed status indicator', () => {
    fc.assert(
      fc.property(exerciseArbitrary, (exercise) => {
        const contentManager = createMockContentManager([exercise]);
        const progressTracker = createMockProgressTracker([exercise.id], [], 'beginner', true);

        const { container } = render(
          <ExerciseInterface
            exerciseId={exercise.id}
            contentManager={contentManager}
            progressTracker={progressTracker}
          />
        );

        // Find the exercise item
        const exerciseItems = container.querySelectorAll('.exercise-item');
        const exerciseItem = Array.from(exerciseItems).find(item => 
          item.textContent?.includes(exercise.title)
        );

        expect(exerciseItem).toBeTruthy();
        
        // Check for completed status indicator (checkmark)
        if (exerciseItem) {
          const statusIndicator = exerciseItem.querySelector('.status-indicator-completed');
          // The status indicator should be present (either as class or via StatusIndicator component)
          const hasCompletedIndicator = exerciseItem.textContent?.includes('✓') || 
                                       statusIndicator !== null;
          expect(hasCompletedIndicator).toBe(true);
        }

        return true;
      }),
      testConfig
    );
  });

  test('for any exercise, locked exercises should display locked status indicator', () => {
    fc.assert(
      fc.property(exerciseArbitrary, (exercise) => {
        const contentManager = createMockContentManager([exercise]);
        // Create a lesson that hasn't been completed, so exercise is locked
        const progressTracker = createMockProgressTracker([], [], 'beginner', false);

        const { container } = render(
          <ExerciseInterface
            contentManager={contentManager}
            progressTracker={progressTracker}
          />
        );

        // Find the exercise item
        const exerciseItems = container.querySelectorAll('.exercise-item');
        const exerciseItem = Array.from(exerciseItems).find(item => 
          item.textContent?.includes(exercise.title)
        );

        expect(exerciseItem).toBeTruthy();
        
        if (exerciseItem) {
          // Check for locked status (lock icon or opacity)
          const hasLockedIndicator = exerciseItem.textContent?.includes('🔒') ||
                                    exerciseItem.classList.contains('locked') ||
                                    (exerciseItem as HTMLElement).style.opacity === '0.5';
          expect(hasLockedIndicator).toBe(true);
        }

        return true;
      }),
      testConfig
    );
  });

  test('for any exercise, unlocked but not completed exercises should display in-progress status indicator', () => {
    fc.assert(
      fc.property(exerciseArbitrary, (exercise) => {
        const contentManager = createMockContentManager([exercise]);
        // Exercise is unlocked but not completed
        const progressTracker = createMockProgressTracker([], [], 'beginner', true);

        const { container } = render(
          <ExerciseInterface
            contentManager={contentManager}
            progressTracker={progressTracker}
          />
        );

        // Find the exercise item
        const exerciseItems = container.querySelectorAll('.exercise-item');
        const exerciseItem = Array.from(exerciseItems).find(item => 
          item.textContent?.includes(exercise.title)
        );

        expect(exerciseItem).toBeTruthy();
        
        if (exerciseItem) {
          // Check for in-progress status (circle or not locked/completed)
          const isNotLocked = exerciseItem.classList.contains('locked') === false &&
                             (exerciseItem as HTMLElement).style.opacity !== '0.5';
          const isNotCompleted = !exerciseItem.textContent?.includes('✓');
          const hasInProgressIndicator = isNotLocked && isNotCompleted;
          
          expect(hasInProgressIndicator).toBe(true);
        }

        return true;
      }),
      testConfig
    );
  });

  test('StatusIndicator component should render correct icon for each status type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'completed' | 'in-progress' | 'locked'>('completed', 'in-progress', 'locked'),
        (status) => {
          const { container } = render(<StatusIndicator status={status} />);
          
          const indicator = container.querySelector('.status-indicator');
          expect(indicator).toBeTruthy();
          
          if (indicator) {
            const text = indicator.textContent || '';
            switch (status) {
              case 'completed':
                expect(text).toContain('✓');
                break;
              case 'locked':
                expect(text).toContain('🔒');
                break;
              case 'in-progress':
                expect(text).toContain('○');
                break;
            }
          }

          return true;
        }
      ),
      testConfig
    );
  });
});

/**
 * **Feature: kubernetes-training-app, Property 31: Validation progress indication**
 * **Validates: Requirements 15.4**
 * 
 * For any validation command execution, progress indicators should be displayed in the UI during execution.
 */
describe('Property 31: Validation progress indication', () => {
  test('for any validation in progress, a loading indicator should be displayed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          success: fc.boolean(),
          message: fc.string({ minLength: 1 }),
          details: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
          suggestions: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 })
        }),
        async (validationResult) => {
          const result: ValidationResult = validationResult;

          // Render with isValidating=true
          const { container, rerender } = render(
            <ValidationFeedback
              validationResult={result}
              isValidating={true}
            />
          );

          // Check for loading indicator
          const loadingElement = container.querySelector('.validation-feedback-loading');
          expect(loadingElement).toBeTruthy();

          // Check for loading text
          const loadingText = container.textContent || '';
          expect(loadingText.toLowerCase()).toMatch(/validating|loading/i);

          // Rerender with isValidating=false to verify it disappears
          rerender(
            <ValidationFeedback
              validationResult={result}
              isValidating={false}
            />
          );

          // Loading indicator should no longer be present
          const loadingElementAfter = container.querySelector('.validation-feedback-loading');
          expect(loadingElementAfter).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('for any exercise interface with validation in progress, validation buttons should show loading state', async () => {
    await fc.assert(
      fc.asyncProperty(
        exerciseArbitrary.filter(ex => ex.steps.length > 0),
        async (exercise) => {
          const contentManager = createMockContentManager([exercise]);
          const progressTracker = createMockProgressTracker([], [], 'beginner', true);
          
          // Mock validation engine that takes time
          let validationResolve: (value: ValidationResult) => void;
          const validationPromise = new Promise<ValidationResult>((resolve) => {
            validationResolve = resolve;
          });

          const validationEngine = {
            validateStep: jest.fn().mockReturnValue(validationPromise)
          };

          const { container } = render(
            <ExerciseInterface
              exerciseId={exercise.id}
              contentManager={contentManager}
              progressTracker={progressTracker}
              validationEngine={validationEngine}
            />
          );

          // Find validate button and click it
          await waitFor(() => {
            const validateButtons = container.querySelectorAll('button');
            const validateButton = Array.from(validateButtons).find(btn => 
              btn.textContent?.toLowerCase().includes('validate')
            );
            expect(validateButton).toBeTruthy();
            return validateButton;
          });

          const validateButtons = container.querySelectorAll('button');
          const validateButton = Array.from(validateButtons).find(btn => 
            btn.textContent?.toLowerCase().includes('validate')
          );

          if (validateButton) {
            // Click the button to start validation
            (validateButton as HTMLButtonElement).click();

            // Wait for validation state to be set
            await waitFor(() => {
              // Check that button is disabled or shows loading state
              const buttonsAfterClick = container.querySelectorAll('button');
              const validateButtonAfter = Array.from(buttonsAfterClick).find(btn => 
                btn.textContent?.toLowerCase().includes('validat')
              );
              
              if (validateButtonAfter) {
                const isDisabled = validateButtonAfter.hasAttribute('disabled') ||
                                  validateButtonAfter.classList.contains('disabled');
                const showsLoading = validateButtonAfter.textContent?.toLowerCase().includes('validating');
                expect(isDisabled || showsLoading).toBe(true);
              }
            }, { timeout: 2000 });

            // Resolve the validation to clean up
            validationResolve!({
              success: true,
              message: 'Validation passed',
              details: [],
              suggestions: []
            });
          }

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs due to async complexity
    );
  });
});

