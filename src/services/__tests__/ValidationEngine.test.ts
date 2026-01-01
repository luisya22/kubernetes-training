import * as fc from 'fast-check';
import { ValidationEngine } from '../ValidationEngine';
import { ValidationCriteria, ValidationCheck } from '../../types';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  // **Feature: kubernetes-training-app, Property 6: Validation execution on completion**
  describe('Property 6: Validation execution on completion', () => {
    test('for any exercise step with validation criteria, marking it as complete should trigger execution of all validation checks', async () => {
      // Arbitrary for generating step IDs
      const stepIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
      
      // Arbitrary for generating validation criteria with checks
      // Use 'custom' type to avoid kubernetes/docker availability checks
      const validationCriteriaArbitrary = fc.record({
        type: fc.constant('custom'), // Use custom to avoid system availability checks
        checks: fc.array(
          fc.record({
            command: fc.constant('echo "test"'), // Always provide a valid command
            expectedOutput: fc.option(fc.string(), { nil: undefined }),
            httpRequest: fc.constant(undefined),
            customValidator: fc.constant(undefined)
          }),
          { minLength: 1, maxLength: 5 }
        )
      }) as fc.Arbitrary<ValidationCriteria>;

      await fc.assert(
        fc.asyncProperty(
          stepIdArbitrary,
          validationCriteriaArbitrary,
          async (stepId, criteria) => {
            // When we validate a step with criteria
            const result = await engine.validateStep(stepId, criteria);
            
            // Then the result should contain details for each check
            // (indicating all checks were executed)
            return result.details.length >= criteria.checks.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 7: Validation success marking**
  describe('Property 7: Validation success marking', () => {
    test('for any validation that passes all checks, the corresponding step status should be marked as complete', async () => {
      const stepIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
      
      // Create criteria with checks that will always succeed
      const successfulCriteriaArbitrary = fc.record({
        type: fc.constant('custom'), // Use custom to avoid system availability checks
        checks: fc.array(
          fc.record({
            command: fc.constant('echo "success"'),
            expectedOutput: fc.constant('success'),
            httpRequest: fc.constant(undefined),
            customValidator: fc.constant(undefined)
          }),
          { minLength: 1, maxLength: 3 }
        )
      }) as fc.Arbitrary<ValidationCriteria>;

      await fc.assert(
        fc.asyncProperty(
          stepIdArbitrary,
          successfulCriteriaArbitrary,
          async (stepId, criteria) => {
            // When all validation checks pass
            const result = await engine.validateStep(stepId, criteria);
            
            // Then success should be true
            return result.success === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 8: Validation failure feedback**
  describe('Property 8: Validation failure feedback', () => {
    test('for any failed validation check, error messages should be displayed indicating which specific criteria failed', async () => {
      const stepIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
      
      // Create criteria with checks that will always fail
      const failingCriteriaArbitrary = fc.record({
        type: fc.constant('custom'), // Use custom to avoid system availability checks
        checks: fc.array(
          fc.record({
            command: fc.constant('exit 1'),
            expectedOutput: fc.constant(undefined),
            httpRequest: fc.constant(undefined),
            customValidator: fc.constant(undefined)
          }),
          { minLength: 1, maxLength: 3 }
        )
      }) as fc.Arbitrary<ValidationCriteria>;

      await fc.assert(
        fc.asyncProperty(
          stepIdArbitrary,
          failingCriteriaArbitrary,
          async (stepId, criteria) => {
            // When validation checks fail
            const result = await engine.validateStep(stepId, criteria);
            
            // Then success should be false
            // And details should contain failure information
            // And message should indicate failure
            return (
              result.success === false &&
              result.details.length > 0 &&
              result.message.includes('failed')
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 16: Validation failure suggestions**
  describe('Property 16: Validation failure suggestions', () => {
    test('for any validation failure, the system should provide at least one troubleshooting suggestion', async () => {
      const stepIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
      
      // Create criteria with checks that will fail
      const failingCriteriaArbitrary = fc.record({
        type: fc.constant('custom'), // Use custom to avoid system availability checks
        checks: fc.array(
          fc.record({
            command: fc.constant('exit 1'),
            expectedOutput: fc.constant(undefined),
            httpRequest: fc.constant(undefined),
            customValidator: fc.constant(undefined)
          }),
          { minLength: 1, maxLength: 3 }
        )
      }) as fc.Arbitrary<ValidationCriteria>;

      await fc.assert(
        fc.asyncProperty(
          stepIdArbitrary,
          failingCriteriaArbitrary,
          async (stepId, criteria) => {
            // When validation fails
            const result = await engine.validateStep(stepId, criteria);
            
            // Then suggestions array should have at least one suggestion
            return result.suggestions.length >= 1;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
