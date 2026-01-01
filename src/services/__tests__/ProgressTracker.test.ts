import { ProgressTracker } from '../ProgressTracker';
import { Progress, DifficultyLevel, serializeProgress, deserializeProgress } from '../../types';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let tempDir: string;
  let tempProgressFile: string;

  beforeEach(() => {
    // Create a temporary directory for test progress files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
    tempProgressFile = path.join(tempDir, 'progress.json');
    progressTracker = new ProgressTracker(tempProgressFile);
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempProgressFile)) {
      fs.unlinkSync(tempProgressFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  test('should be instantiable', () => {
    expect(progressTracker).toBeInstanceOf(ProgressTracker);
  });

  // **Feature: kubernetes-training-app, Property 11: Progress persistence round-trip**
  // **Validates: Requirements 5.3**
  describe('Property 11: Progress persistence round-trip', () => {
    test('serializing and deserializing progress preserves state', () => {
      // Custom arbitrary for DifficultyLevel
      const difficultyLevelArbitrary = fc.constantFrom<DifficultyLevel>(
        'beginner',
        'intermediate',
        'advanced'
      );

      // Custom arbitrary for Progress
      const progressArbitrary = fc.record({
        completedLessons: fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
        completedExercises: fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
        currentLevel: difficultyLevelArbitrary,
        timestamps: fc.dictionary(
          fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'), // Exclude problematic keys
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          { minKeys: 0, maxKeys: 20 }
        ).map(dict => {
          const map = new Map<string, Date>();
          Object.entries(dict).forEach(([key, value]) => {
            map.set(key, value);
          });
          return map;
        })
      }) as fc.Arbitrary<Progress>;

      fc.assert(
        fc.property(progressArbitrary, (originalProgress) => {
          // Serialize the progress
          const serialized = serializeProgress(originalProgress);
          
          // Deserialize it back
          const deserialized = deserializeProgress(serialized);
          
          // Verify all fields are preserved
          const lessonsMatch = 
            deserialized.completedLessons.length === originalProgress.completedLessons.length &&
            deserialized.completedLessons.every((lesson, idx) => 
              lesson === originalProgress.completedLessons[idx]
            );
          
          const exercisesMatch = 
            deserialized.completedExercises.length === originalProgress.completedExercises.length &&
            deserialized.completedExercises.every((exercise, idx) => 
              exercise === originalProgress.completedExercises[idx]
            );
          
          const levelMatches = deserialized.currentLevel === originalProgress.currentLevel;
          
          // Verify timestamps are preserved (comparing ISO strings since Date objects may differ slightly)
          const timestampsMatch = 
            deserialized.timestamps.size === originalProgress.timestamps.size &&
            Array.from(originalProgress.timestamps.entries()).every(([key, date]) => {
              const deserializedDate = deserialized.timestamps.get(key);
              return deserializedDate && 
                     deserializedDate.toISOString() === date.toISOString();
            });
          
          return lessonsMatch && exercisesMatch && levelMatches && timestampsMatch;
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 12: Progress recording**
  // **Validates: Requirements 5.1**
  describe('Property 12: Progress recording', () => {
    test('recording completion creates a progress record with timestamp', () => {
      const itemIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });
      const itemTypeArbitrary = fc.constantFrom<'lesson' | 'exercise'>('lesson', 'exercise');

      fc.assert(
        fc.property(itemIdArbitrary, itemTypeArbitrary, (itemId, itemType) => {
          // Create a fresh progress tracker for each test
          const testProgressFile = path.join(tempDir, `progress-${Date.now()}-${Math.random()}.json`);
          const tracker = new ProgressTracker(testProgressFile);
          
          const beforeTime = new Date();
          
          // Record completion
          tracker.recordCompletion(itemId, itemType);
          
          const afterTime = new Date();
          
          // Get progress
          const progress = tracker.getProgress();
          
          // Verify the item is in the appropriate completed list
          const isInList = itemType === 'lesson' 
            ? progress.completedLessons.includes(itemId)
            : progress.completedExercises.includes(itemId);
          
          // Verify timestamp exists and is within the expected range
          const timestamp = progress.timestamps.get(itemId);
          const hasTimestamp = timestamp !== undefined;
          const timestampInRange = timestamp 
            ? timestamp >= beforeTime && timestamp <= afterTime
            : false;
          
          // Clean up
          if (fs.existsSync(testProgressFile)) {
            fs.unlinkSync(testProgressFile);
          }
          
          return isInList && hasTimestamp && timestampInRange;
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 13: Level unlocking**
  // **Validates: Requirements 5.4, 7.5**
  describe('Property 13: Level unlocking', () => {
    test('completing all exercises in a level unlocks the next level', () => {
      // Create a mock content manager for testing
      const createMockContentManager = (beginnerExercises: string[], intermediateExercises: string[]) => {
        return {
          getLessons: (level: DifficultyLevel) => {
            if (level === 'beginner') {
              return [{ id: 'lesson-beginner-1', level: 'beginner', exercises: beginnerExercises }];
            } else if (level === 'intermediate') {
              return [{ id: 'lesson-intermediate-1', level: 'intermediate', exercises: intermediateExercises }];
            } else {
              return [{ id: 'lesson-advanced-1', level: 'advanced', exercises: [] }];
            }
          },
          getExercisesByLesson: (lessonId: string) => {
            if (lessonId === 'lesson-beginner-1') {
              return beginnerExercises.map(id => ({ id, lessonId }));
            } else if (lessonId === 'lesson-intermediate-1') {
              return intermediateExercises.map(id => ({ id, lessonId }));
            }
            return [];
          },
          getLesson: (id: string) => null,
          getExercise: (id: string) => null
        };
      };

      // Generate random exercise IDs
      const exerciseIdArbitrary = fc.array(
        fc.string({ minLength: 1, maxLength: 20 }),
        { minLength: 1, maxLength: 10 }
      ).map(arr => Array.from(new Set(arr))); // Ensure unique IDs

      fc.assert(
        fc.property(exerciseIdArbitrary, exerciseIdArbitrary, (beginnerExercises, intermediateExercises) => {
          // Skip if no exercises
          if (beginnerExercises.length === 0) {
            return true;
          }

          const testProgressFile = path.join(tempDir, `progress-${Date.now()}-${Math.random()}.json`);
          const mockContentManager = createMockContentManager(beginnerExercises, intermediateExercises);
          const tracker = new ProgressTracker(testProgressFile, mockContentManager);
          
          // Initially should be at beginner level
          let progress = tracker.getProgress();
          const startsAtBeginner = progress.currentLevel === 'beginner';
          
          // Complete all beginner exercises
          beginnerExercises.forEach(exerciseId => {
            tracker.recordCompletion(exerciseId, 'exercise');
          });
          
          // Should now be at intermediate level
          progress = tracker.getProgress();
          const advancesToIntermediate = progress.currentLevel === 'intermediate';
          
          // If there are intermediate exercises, complete them
          let advancesToAdvanced = true;
          if (intermediateExercises.length > 0) {
            intermediateExercises.forEach(exerciseId => {
              tracker.recordCompletion(exerciseId, 'exercise');
            });
            
            // Should now be at advanced level
            progress = tracker.getProgress();
            advancesToAdvanced = progress.currentLevel === 'advanced';
          }
          
          // Clean up
          if (fs.existsSync(testProgressFile)) {
            fs.unlinkSync(testProgressFile);
          }
          
          return startsAtBeginner && advancesToIntermediate && advancesToAdvanced;
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 17: Exercise reset clears completion**
  // **Validates: Requirements 9.1**
  describe('Property 17: Exercise reset clears completion', () => {
    test('resetting an exercise clears its completion status while preserving definition', () => {
      const exerciseIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });

      fc.assert(
        fc.property(exerciseIdArbitrary, (exerciseId) => {
          const testProgressFile = path.join(tempDir, `progress-${Date.now()}-${Math.random()}.json`);
          const tracker = new ProgressTracker(testProgressFile);
          
          // Record completion
          tracker.recordCompletion(exerciseId, 'exercise');
          
          // Verify it's completed
          let progress = tracker.getProgress();
          const wasCompleted = progress.completedExercises.includes(exerciseId);
          const hadTimestamp = progress.timestamps.has(exerciseId);
          
          // Reset the exercise
          tracker.resetProgress('exercise', exerciseId);
          
          // Verify it's no longer completed
          progress = tracker.getProgress();
          const isNotCompleted = !progress.completedExercises.includes(exerciseId);
          const noTimestamp = !progress.timestamps.has(exerciseId);
          
          // Clean up
          if (fs.existsSync(testProgressFile)) {
            fs.unlinkSync(testProgressFile);
          }
          
          return wasCompleted && hadTimestamp && isNotCompleted && noTimestamp;
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 2: Exercise unlocking**
  // **Validates: Requirements 1.4**
  describe('Property 2: Exercise unlocking', () => {
    test('marking a lesson as complete unlocks all associated exercises', () => {
      // Generate random lesson IDs and associated exercise IDs
      const lessonWithExercisesArbitrary = fc.record({
        lessonId: fc.string({ minLength: 1, maxLength: 50 }),
        exerciseIds: fc.array(
          fc.string({ minLength: 1, maxLength: 50 }),
          { minLength: 1, maxLength: 10 }
        ).map(arr => Array.from(new Set(arr))) // Ensure unique exercise IDs
      });

      fc.assert(
        fc.property(lessonWithExercisesArbitrary, ({ lessonId, exerciseIds }) => {
          // Skip if no exercises
          if (exerciseIds.length === 0) {
            return true;
          }

          const testProgressFile = path.join(tempDir, `progress-${Date.now()}-${Math.random()}.json`);
          
          // Create a mock content manager with the lesson and exercises
          const mockContentManager = {
            getLessons: (level: DifficultyLevel) => {
              return [{ id: lessonId, level: 'beginner', exercises: exerciseIds }];
            },
            getExercisesByLesson: (id: string) => {
              if (id === lessonId) {
                return exerciseIds.map(exId => ({ id: exId, lessonId }));
              }
              return [];
            },
            getLesson: (id: string) => {
              if (id === lessonId) {
                return { id: lessonId, level: 'beginner' as DifficultyLevel, exercises: exerciseIds };
              }
              return null;
            },
            getExercise: (id: string) => {
              if (exerciseIds.includes(id)) {
                return { id, lessonId };
              }
              return null;
            }
          };
          
          const tracker = new ProgressTracker(testProgressFile, mockContentManager);
          
          // Before completing the lesson, exercises should be locked
          const exercisesLockedBefore = exerciseIds.every(exId => !tracker.isUnlocked(exId));
          
          // Complete the lesson
          tracker.recordCompletion(lessonId, 'lesson');
          
          // After completing the lesson, all exercises should be unlocked
          const exercisesUnlockedAfter = exerciseIds.every(exId => tracker.isUnlocked(exId));
          
          // Clean up
          if (fs.existsSync(testProgressFile)) {
            fs.unlinkSync(testProgressFile);
          }
          
          return exercisesLockedBefore && exercisesUnlockedAfter;
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 18: Progress reset preserves content**
  // **Validates: Requirements 9.3**
  describe('Property 18: Progress reset preserves content', () => {
    test('resetting progress clears completion timestamps but preserves lesson and exercise definitions', () => {
      // Generate random completed items
      const completedItemsArbitrary = fc.record({
        lessons: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
        exercises: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 })
      });

      fc.assert(
        fc.property(completedItemsArbitrary, (completedItems) => {
          const testProgressFile = path.join(tempDir, `progress-${Date.now()}-${Math.random()}.json`);
          
          // Create a mock content manager with some lessons and exercises
          const mockLessons = [
            { id: 'lesson-1', title: 'Lesson 1', level: 'beginner' as DifficultyLevel },
            { id: 'lesson-2', title: 'Lesson 2', level: 'intermediate' as DifficultyLevel }
          ];
          const mockExercises = [
            { id: 'exercise-1', lessonId: 'lesson-1', title: 'Exercise 1' },
            { id: 'exercise-2', lessonId: 'lesson-2', title: 'Exercise 2' }
          ];
          
          const mockContentManager = {
            getLessons: (level: DifficultyLevel) => mockLessons.filter(l => l.level === level),
            getExercisesByLesson: (lessonId: string) => mockExercises.filter(e => e.lessonId === lessonId),
            getLesson: (id: string) => mockLessons.find(l => l.id === id) || null,
            getExercise: (id: string) => mockExercises.find(e => e.id === id) || null
          };
          
          const tracker = new ProgressTracker(testProgressFile, mockContentManager);
          
          // Record completions
          completedItems.lessons.forEach(lessonId => {
            tracker.recordCompletion(lessonId, 'lesson');
          });
          completedItems.exercises.forEach(exerciseId => {
            tracker.recordCompletion(exerciseId, 'exercise');
          });
          
          // Verify items are completed
          let progress = tracker.getProgress();
          const hadCompletions = 
            progress.completedLessons.length > 0 || 
            progress.completedExercises.length > 0 ||
            progress.timestamps.size > 0;
          
          // Content should still be accessible (mock content manager still works)
          const contentBeforeReset = {
            lessons: mockContentManager.getLessons('beginner'),
            exercises: mockContentManager.getExercisesByLesson('lesson-1')
          };
          
          // Reset all progress
          tracker.resetProgress('all');
          
          // Verify progress is cleared
          progress = tracker.getProgress();
          const progressCleared = 
            progress.completedLessons.length === 0 &&
            progress.completedExercises.length === 0 &&
            progress.timestamps.size === 0 &&
            progress.currentLevel === 'beginner';
          
          // Content should still be accessible (mock content manager still works)
          const contentAfterReset = {
            lessons: mockContentManager.getLessons('beginner'),
            exercises: mockContentManager.getExercisesByLesson('lesson-1')
          };
          
          const contentPreserved = 
            contentBeforeReset.lessons.length === contentAfterReset.lessons.length &&
            contentBeforeReset.exercises.length === contentAfterReset.exercises.length;
          
          // Clean up
          if (fs.existsSync(testProgressFile)) {
            fs.unlinkSync(testProgressFile);
          }
          
          // If there were no completions, we can't test the reset behavior meaningfully
          if (!hadCompletions && completedItems.lessons.length === 0 && completedItems.exercises.length === 0) {
            return true;
          }
          
          return progressCleared && contentPreserved;
        }),
        { numRuns: 100 }
      );
    });
  });
});

