import * as fc from 'fast-check';
import { 
  Progress, 
  serializeProgress, 
  deserializeProgress,
  DifficultyLevel 
} from '../index';

describe('Progress Data Model', () => {
  // **Feature: kubernetes-training-app, Property 11: Progress persistence round-trip**
  test('progress round-trip preserves state', () => {
    // Arbitrary for DifficultyLevel
    const difficultyLevelArbitrary = fc.constantFrom<DifficultyLevel>(
      'beginner',
      'intermediate',
      'advanced'
    );

    // Arbitrary for safe string keys (avoiding JavaScript special properties)
    const safeKeyArbitrary = fc.string().filter(
      key => !['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'].includes(key)
    );

    // Arbitrary for Progress
    const progressArbitrary = fc.record({
      completedLessons: fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
      completedExercises: fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
      currentLevel: difficultyLevelArbitrary,
      timestamps: fc.dictionary(
        safeKeyArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      ).map(dict => {
        const map = new Map<string, Date>();
        Object.entries(dict).forEach(([key, value]) => {
          map.set(key, value);
        });
        return map;
      })
    });

    fc.assert(
      fc.property(progressArbitrary, (progress: Progress) => {
        // Serialize the progress
        const serialized = serializeProgress(progress);
        
        // Deserialize it back
        const deserialized = deserializeProgress(serialized);
        
        // Verify all fields are preserved
        const lessonsMatch = 
          deserialized.completedLessons.length === progress.completedLessons.length &&
          deserialized.completedLessons.every((lesson, idx) => 
            lesson === progress.completedLessons[idx]
          );
        
        const exercisesMatch = 
          deserialized.completedExercises.length === progress.completedExercises.length &&
          deserialized.completedExercises.every((exercise, idx) => 
            exercise === progress.completedExercises[idx]
          );
        
        const levelMatches = deserialized.currentLevel === progress.currentLevel;
        
        // Verify timestamps map
        const timestampsMatch = 
          deserialized.timestamps.size === progress.timestamps.size &&
          Array.from(progress.timestamps.entries()).every(([key, date]) => {
            const deserializedDate = deserialized.timestamps.get(key);
            // Compare timestamps (milliseconds since epoch) to handle Date equality
            return deserializedDate && deserializedDate.getTime() === date.getTime();
          });
        
        return lessonsMatch && exercisesMatch && levelMatches && timestampsMatch;
      }),
      { numRuns: 100 }
    );
  });

  test('serialization produces valid JSON', () => {
    const difficultyLevelArbitrary = fc.constantFrom<DifficultyLevel>(
      'beginner',
      'intermediate',
      'advanced'
    );

    // Arbitrary for safe string keys (avoiding JavaScript special properties)
    const safeKeyArbitrary = fc.string().filter(
      key => !['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'].includes(key)
    );

    const progressArbitrary = fc.record({
      completedLessons: fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
      completedExercises: fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
      currentLevel: difficultyLevelArbitrary,
      timestamps: fc.dictionary(
        safeKeyArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      ).map(dict => {
        const map = new Map<string, Date>();
        Object.entries(dict).forEach(([key, value]) => {
          map.set(key, value);
        });
        return map;
      })
    });

    fc.assert(
      fc.property(progressArbitrary, (progress: Progress) => {
        const serialized = serializeProgress(progress);
        
        // Should be able to convert to JSON and back
        const jsonString = JSON.stringify(serialized);
        const parsed = JSON.parse(jsonString);
        
        // Should be able to deserialize the parsed JSON
        const deserialized = deserializeProgress(parsed);
        
        // Verify it matches original
        return (
          deserialized.completedLessons.length === progress.completedLessons.length &&
          deserialized.completedExercises.length === progress.completedExercises.length &&
          deserialized.currentLevel === progress.currentLevel &&
          deserialized.timestamps.size === progress.timestamps.size
        );
      }),
      { numRuns: 100 }
    );
  });

  test('empty progress serializes and deserializes correctly', () => {
    const emptyProgress: Progress = {
      completedLessons: [],
      completedExercises: [],
      currentLevel: 'beginner',
      timestamps: new Map()
    };

    const serialized = serializeProgress(emptyProgress);
    const deserialized = deserializeProgress(serialized);

    expect(deserialized.completedLessons).toEqual([]);
    expect(deserialized.completedExercises).toEqual([]);
    expect(deserialized.currentLevel).toBe('beginner');
    expect(deserialized.timestamps.size).toBe(0);
  });

  test('progress with multiple timestamps preserves all entries', () => {
    const progress: Progress = {
      completedLessons: ['lesson1', 'lesson2'],
      completedExercises: ['ex1', 'ex2', 'ex3'],
      currentLevel: 'intermediate',
      timestamps: new Map([
        ['lesson1', new Date('2024-01-01T10:00:00Z')],
        ['lesson2', new Date('2024-01-02T15:30:00Z')],
        ['ex1', new Date('2024-01-03T08:45:00Z')],
        ['ex2', new Date('2024-01-04T12:00:00Z')],
        ['ex3', new Date('2024-01-05T18:20:00Z')]
      ])
    };

    const serialized = serializeProgress(progress);
    const deserialized = deserializeProgress(serialized);

    expect(deserialized.timestamps.size).toBe(5);
    expect(deserialized.timestamps.get('lesson1')?.getTime()).toBe(
      new Date('2024-01-01T10:00:00Z').getTime()
    );
    expect(deserialized.timestamps.get('ex3')?.getTime()).toBe(
      new Date('2024-01-05T18:20:00Z').getTime()
    );
  });
});
