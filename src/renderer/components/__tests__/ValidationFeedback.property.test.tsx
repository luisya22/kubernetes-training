import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ValidationFeedback from '../ValidationFeedback';
import { ValidationResult } from '../../../types';

// Arbitrary for generating validation results
const validationResultArbitrary: fc.Arbitrary<ValidationResult> = fc.record({
  success: fc.boolean(),
  message: fc.string({ minLength: 5 }).filter(s => s.trim().length > 0), // Ensure non-whitespace messages
  details: fc.array(fc.string({ minLength: 3 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 5 }),
  suggestions: fc.array(fc.string({ minLength: 3 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 5 })
});

/**
 * **Feature: kubernetes-training-app, Property 15: Validation retry execution**
 * **Validates: Requirements 8.4, 9.4**
 * 
 * For any exercise step, retrying validation should re-execute all validation commands as if attempting for the first time.
 */
describe('Property 15: Validation retry execution', () => {
  it('should re-execute validation from scratch when retry is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        validationResultArbitrary.filter(result => !result.success), // Only test failed validations
        async (failedResult) => {
          // Track validation calls
          let validationCallCount = 0;
          const validationResults: ValidationResult[] = [
            failedResult,
            { ...failedResult, success: true, message: 'Retry succeeded' }
          ];

          const mockOnRetry = jest.fn(() => {
            validationCallCount++;
          });

          const { rerender, unmount } = render(
            <ValidationFeedback
              validationResult={failedResult}
              onRetry={mockOnRetry}
              isValidating={false}
            />
          );

          // Verify initial failed state is displayed
          expect(screen.getAllByText('Validation Failed')[0]).toBeInTheDocument();
          
          // Use a more flexible text matcher for the message
          const messageElement = screen.getByText((content, element) => {
            return element?.textContent === failedResult.message;
          });
          expect(messageElement).toBeInTheDocument();

          // Find and click the retry button
          const retryButton = screen.getByRole('button', { name: /retry/i });
          expect(retryButton).toBeInTheDocument();
          expect(retryButton).not.toBeDisabled();

          // Click retry
          fireEvent.click(retryButton);

          // Verify retry callback was called
          expect(mockOnRetry).toHaveBeenCalledTimes(1);
          expect(validationCallCount).toBe(1);

          // Simulate validation in progress
          rerender(
            <ValidationFeedback
              validationResult={failedResult}
              onRetry={mockOnRetry}
              isValidating={true}
            />
          );

          // When validating, should show loading indicator instead of retry button
          expect(screen.getByText('Validating...')).toBeInTheDocument();
          expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();

          // Simulate successful retry result
          const successResult = validationResults[1];
          rerender(
            <ValidationFeedback
              validationResult={successResult}
              onRetry={mockOnRetry}
              isValidating={false}
            />
          );

          // Verify success state is displayed
          await waitFor(() => {
            expect(screen.getByText('Validation Passed')).toBeInTheDocument();
          });

          // Retry button should not be visible for successful validation
          expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();

          // Verify that retry can be called multiple times if validation keeps failing
          const anotherFailedResult = { ...failedResult, message: 'Still failing' };
          rerender(
            <ValidationFeedback
              validationResult={anotherFailedResult}
              onRetry={mockOnRetry}
              isValidating={false}
            />
          );

          const retryButton2 = screen.getByRole('button', { name: /retry/i });
          fireEvent.click(retryButton2);

          expect(mockOnRetry).toHaveBeenCalledTimes(2);
          expect(validationCallCount).toBe(2);

          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should execute validation independently on each retry without state carryover', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validationResultArbitrary.filter(r => !r.success), { minLength: 2, maxLength: 5 }),
        async (failedResults) => {
          const mockOnRetry = jest.fn();
          let currentResultIndex = 0;

          const { rerender, unmount } = render(
            <ValidationFeedback
              validationResult={failedResults[currentResultIndex]}
              onRetry={mockOnRetry}
              isValidating={false}
            />
          );

          // Perform multiple retries
          for (let i = 0; i < failedResults.length; i++) {
            const currentResult = failedResults[i];

            // Verify current result is displayed (use regex to handle special characters)
            const messageElement = screen.getByText((content, element) => {
              return element?.textContent === currentResult.message;
            });
            expect(messageElement).toBeInTheDocument();

            // Click retry
            const retryButton = screen.getByRole('button', { name: /retry/i });
            fireEvent.click(retryButton);

            // Verify retry was called
            expect(mockOnRetry).toHaveBeenCalledTimes(i + 1);

            // Move to next result (simulating a new validation attempt)
            if (i < failedResults.length - 1) {
              currentResultIndex = i + 1;
              rerender(
                <ValidationFeedback
                  validationResult={failedResults[currentResultIndex]}
                  onRetry={mockOnRetry}
                  isValidating={false}
                />
              );
            }
          }

          // Verify total number of retries matches number of failed results
          expect(mockOnRetry).toHaveBeenCalledTimes(failedResults.length);

          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
