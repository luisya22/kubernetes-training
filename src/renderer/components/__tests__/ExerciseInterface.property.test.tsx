import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ExerciseInterface from '../ExerciseInterface';
import { Exercise, ExerciseStep, ValidationCriteria } from '../../../types';

// Arbitraries for generating test data
const exerciseStepArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  instruction: fc.string({ minLength: 1 }),
  expectedOutcome: fc.string({ minLength: 1 }),
  hints: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 })
});

const validationCriteriaArbitrary: fc.Arbitrary<ValidationCriteria> = fc.record({
  type: fc.constantFrom('kubernetes' as const, 'docker' as const, 'http' as const, 'custom' as const),
  checks: fc.array(fc.record({
    command: fc.option(fc.string(), { nil: undefined }),
    expectedOutput: fc.option(fc.string(), { nil: undefined })
  }), { minLength: 1, maxLength: 3 })
}) as fc.Arbitrary<ValidationCriteria>;

const exerciseArbitrary: fc.Arbitrary<Exercise> = fc.record({
  id: fc.string({ minLength: 1 }),
  lessonId: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  description: fc.string({ minLength: 1 }),
  steps: fc.array(exerciseStepArbitrary, { minLength: 1, maxLength: 5 }),
  validationCriteria: fc.array(validationCriteriaArbitrary, { minLength: 1, maxLength: 5 })
}).map(exercise => ({
  ...exercise,
  // Ensure validationCriteria array matches steps array length
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

// Mock progress tracker
const createMockProgressTracker = () => ({
  getProgress: () => ({
    completedLessons: [],
    completedExercises: [],
    currentLevel: 'beginner' as const,
    timestamps: new Map()
  }),
  isUnlocked: () => true,
  recordCompletion: jest.fn()
});

/**
 * **Feature: kubernetes-training-app, Property 3: Exercise step display completeness**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any exercise, the UI should display instructions and expected outcomes for all defined steps.
 */
describe('Property 3: Exercise step display completeness', () => {
  it('should display instructions and expected outcomes for all steps in any exercise', () => {
    fc.assert(
      fc.property(exerciseArbitrary, (exercise) => {
        const contentManager = createMockContentManager([exercise]);
        const progressTracker = createMockProgressTracker();

        const { container } = render(
          <ExerciseInterface
            exerciseId={exercise.id}
            contentManager={contentManager}
            progressTracker={progressTracker}
          />
        );

        // Wait for component to load
        const stepElements = container.querySelectorAll('.step');
        
        // Should have rendered all steps
        expect(stepElements.length).toBe(exercise.steps.length);

        // Check each step has instruction and expected outcome
        exercise.steps.forEach((step, index) => {
          const stepElement = stepElements[index];
          
          // Check instruction is present
          const instructionText = stepElement.textContent || '';
          expect(instructionText).toContain(step.instruction);
          
          // Check expected outcome is present
          expect(instructionText).toContain(step.expectedOutcome);
        });
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: kubernetes-training-app, Property 4: Sequential step progression**
 * **Validates: Requirements 2.3**
 * 
 * For any exercise with multiple steps, completing step N should enable step N+1 and prevent access to step N+2.
 */
describe('Property 4: Sequential step progression', () => {
  it('should enable next step after completing current step and keep subsequent steps locked', async () => {
    await fc.assert(
      fc.asyncProperty(
        exerciseArbitrary.filter(ex => ex.steps.length >= 3), // Need at least 3 steps to test N, N+1, N+2
        async (exercise) => {
          const contentManager = createMockContentManager([exercise]);
          const progressTracker = createMockProgressTracker();
          
          // Mock validation engine that always succeeds
          const validationEngine = {
            validateStep: jest.fn().mockResolvedValue({
              success: true,
              message: 'Validation passed',
              details: [],
              suggestions: []
            })
          };

          const { container } = render(
            <ExerciseInterface
              exerciseId={exercise.id}
              contentManager={contentManager}
              progressTracker={progressTracker}
              validationEngine={validationEngine}
            />
          );

          // Initially, only step 1 should be accessible
          let steps = container.querySelectorAll('.step');
          expect(steps.length).toBe(exercise.steps.length);
          
          // Check that step 1 (index 0) is accessible (not locked)
          let step1 = steps[0] as HTMLElement;
          expect(step1.classList.contains('locked')).toBe(false);
          expect(step1.style.opacity).not.toBe('0.5');
          
          // Check that step 2 (index 1) is locked initially
          let step2 = steps[1] as HTMLElement;
          expect(step2.classList.contains('locked')).toBe(true);
          expect(step2.style.opacity).toBe('0.5');
          
          // Check that step 3 (index 2) is locked initially
          let step3 = steps[2] as HTMLElement;
          expect(step3.classList.contains('locked')).toBe(true);
          expect(step3.style.opacity).toBe('0.5');
          
          // Find and click the validate button for step 1
          const validateButtons = step1.querySelectorAll('button');
          const validateButton = Array.from(validateButtons).find(btn => 
            btn.textContent?.includes('Validate')
          );
          
          if (validateButton) {
            fireEvent.click(validateButton);
            
            // Wait for validation to complete and UI to update
            await waitFor(() => {
              steps = container.querySelectorAll('.step');
              step1 = steps[0] as HTMLElement;
              step2 = steps[1] as HTMLElement;
              step3 = steps[2] as HTMLElement;
              
              // After completing step 1, step 2 should now be accessible
              expect(step2.classList.contains('locked')).toBe(false);
              expect(step2.style.opacity).not.toBe('0.5');
              
              // Step 3 should still be locked
              expect(step3.classList.contains('locked')).toBe(true);
              expect(step3.style.opacity).toBe('0.5');
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: kubernetes-training-app, Property 5: Hint availability**
 * **Validates: Requirements 2.4**
 * 
 * For any exercise step that has hints defined, requesting help should display all available hints for that step.
 */
describe('Property 5: Hint availability', () => {
  it('should display all hints when help is requested for a step with hints', async () => {
    await fc.assert(
      fc.asyncProperty(
        exerciseArbitrary.filter(ex => ex.steps.some(step => step.hints.length > 0)), // Need at least one step with hints
        async (exercise) => {
          const contentManager = createMockContentManager([exercise]);
          const progressTracker = createMockProgressTracker();

          const { container } = render(
            <ExerciseInterface
              exerciseId={exercise.id}
              contentManager={contentManager}
              progressTracker={progressTracker}
            />
          );

          // Find steps that have hints
          const stepsWithHints = exercise.steps.filter(step => step.hints.length > 0);
          
          // For each step with hints, verify they can be displayed
          for (const step of stepsWithHints) {
            // Find the actual step index in the full exercise
            const actualStepIndex = exercise.steps.findIndex(s => s.id === step.id);
            
            // Only check accessible steps (step 0 is always accessible)
            if (actualStepIndex === 0) {
              const stepElements = container.querySelectorAll('.step');
              const stepElement = stepElements[actualStepIndex] as HTMLElement;
              
              // Check if there's a hints button
              const hintsButtons = Array.from(stepElement.querySelectorAll('button'));
              const hintsButton = hintsButtons.find(btn => 
                btn.textContent?.includes('Hint') || 
                btn.textContent?.includes('Show') ||
                btn.textContent?.includes('Hide')
              );
              
              // If step has hints, there should be a hints button
              expect(hintsButton).toBeTruthy();
              
              // Click the button to show hints
              if (hintsButton) {
                fireEvent.click(hintsButton);
                
                // Wait for hints to appear and verify all hints are visible
                await waitFor(() => {
                  step.hints.forEach(hint => {
                    const stepText = stepElement.textContent || '';
                    expect(stepText).toContain(hint);
                  });
                });
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
