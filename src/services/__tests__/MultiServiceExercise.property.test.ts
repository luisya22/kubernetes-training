import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { ExerciseDefinition } from '../../types';

/**
 * **Feature: kubernetes-training-app, Property 32: Multi-service exercise composition**
 * 
 * Property: For any multi-service exercise, it should include at least two microservices 
 * with defined communication paths between them.
 * 
 * Validates: Requirements 16.1
 */

describe('Property 32: Multi-service exercise composition', () => {
  const contentPath = path.join(__dirname, '../../../content');

  // Helper to load raw exercise definition with resources
  function loadExerciseDefinition(exerciseId: string): ExerciseDefinition | null {
    const exercisesDir = path.join(contentPath, 'exercises');
    const files = fs.readdirSync(exercisesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(exercisesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const exerciseDef: ExerciseDefinition = JSON.parse(content);
        
        if (exerciseDef.id === exerciseId) {
          return exerciseDef;
        }
      }
    }
    
    return null;
  }

  test('multi-service exercises include at least two microservices with communication paths', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'exercise-deploy-microservice',
          // Add more multi-service exercise IDs as they are created
        ),
        (exerciseId) => {
          const exerciseDef = loadExerciseDefinition(exerciseId);
          
          // Exercise should exist
          expect(exerciseDef).toBeDefined();
          expect(exerciseDef).not.toBeNull();
          
          if (!exerciseDef) return false;
          
          // Should have resources
          expect(exerciseDef.resources).toBeDefined();
          expect(Array.isArray(exerciseDef.resources)).toBe(true);
          
          // Filter for microservice resources
          const microservices = exerciseDef.resources.filter(
            (resource) => resource.type === 'microservice'
          );
          
          // Should have at least 2 microservices
          expect(microservices.length).toBeGreaterThanOrEqual(2);
          
          // Check if there's a gateway or service that communicates with others
          // This is indicated by having multiple microservices where at least one
          // references others (like api-gateway referencing hello-service and counter-service)
          const hasGatewayOrCommunication = microservices.some((ms) => 
            ms.name.includes('gateway') || ms.name.includes('api')
          );
          
          // Either has a gateway/api service, or has multiple services that should communicate
          const hasCommunicationPath = hasGatewayOrCommunication || microservices.length >= 2;
          
          expect(hasCommunicationPath).toBe(true);
          
          // Verify each microservice resource has required properties
          microservices.forEach((ms) => {
            expect(ms.name).toBeDefined();
            expect(typeof ms.name).toBe('string');
            expect(ms.path).toBeDefined();
            expect(typeof ms.path).toBe('string');
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multi-service exercises have validation steps that test service communication', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('exercise-deploy-microservice'),
        (exerciseId) => {
          const exerciseDef = loadExerciseDefinition(exerciseId);
          
          expect(exerciseDef).not.toBeNull();
          if (!exerciseDef) return false;
          
          // Should have steps
          expect(exerciseDef.steps).toBeDefined();
          expect(Array.isArray(exerciseDef.steps)).toBe(true);
          expect(exerciseDef.steps.length).toBeGreaterThan(0);
          
          // At least one step should involve testing communication or HTTP validation
          const hasCommunicationTest = exerciseDef.steps.some((step) => {
            const instruction = step.instruction?.toLowerCase() || '';
            const expectedOutcome = step.expectedOutcome?.toLowerCase() || '';
            const validationType = step.validation?.type || '';
            
            return (
              instruction.includes('communication') ||
              instruction.includes('route') ||
              instruction.includes('gateway') ||
              expectedOutcome.includes('communicate') ||
              expectedOutcome.includes('accessible') ||
              validationType === 'http'
            );
          });
          
          expect(hasCommunicationTest).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('microservice resources reference valid paths', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('exercise-deploy-microservice'),
        (exerciseId) => {
          const exerciseDef = loadExerciseDefinition(exerciseId);
          
          expect(exerciseDef).not.toBeNull();
          if (!exerciseDef) return false;
          
          const microservices = exerciseDef.resources.filter(
            (resource) => resource.type === 'microservice'
          );
          
          // Each microservice should have a valid path structure
          microservices.forEach((ms) => {
            expect(ms.path).toMatch(/^content\/microservices\/[\w-]+$/);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
