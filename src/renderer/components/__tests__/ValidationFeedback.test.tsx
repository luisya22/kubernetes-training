import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ValidationFeedback from '../ValidationFeedback';
import { ValidationResult } from '../../../types';

describe('ValidationFeedback Component', () => {
  it('should render success state correctly', () => {
    const successResult: ValidationResult = {
      success: true,
      message: 'All checks passed',
      details: ['Check 1 passed', 'Check 2 passed'],
      suggestions: []
    };

    render(<ValidationFeedback validationResult={successResult} />);

    expect(screen.getByText('Validation Passed')).toBeInTheDocument();
    expect(screen.getByText('All checks passed')).toBeInTheDocument();
    expect(screen.getByText('Check 1 passed')).toBeInTheDocument();
    expect(screen.getByText('Check 2 passed')).toBeInTheDocument();
    
    // Retry button should not be present for successful validation
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should render failure state with error highlighting', () => {
    const failureResult: ValidationResult = {
      success: false,
      message: 'Validation failed',
      details: ['FAILED: Pod not found', 'Check 2 passed'],
      suggestions: ['Check if pod exists', 'Verify namespace']
    };

    const mockOnRetry = jest.fn();

    render(
      <ValidationFeedback
        validationResult={failureResult}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Validation Failed')).toBeInTheDocument();
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    
    // Check error details are highlighted
    const failedDetail = screen.getByText('FAILED: Pod not found');
    expect(failedDetail).toHaveStyle({ color: 'rgb(198, 40, 40)', fontWeight: 'bold' });
    
    // Check suggestions are displayed
    expect(screen.getByText('Check if pod exists')).toBeInTheDocument();
    expect(screen.getByText('Verify namespace')).toBeInTheDocument();
    
    // Retry button should be present
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  it('should call onRetry when retry button is clicked', () => {
    const failureResult: ValidationResult = {
      success: false,
      message: 'Validation failed',
      details: [],
      suggestions: []
    };

    const mockOnRetry = jest.fn();

    render(
      <ValidationFeedback
        validationResult={failureResult}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should disable retry button when validating', () => {
    const failureResult: ValidationResult = {
      success: false,
      message: 'Validation failed',
      details: [],
      suggestions: []
    };

    const mockOnRetry = jest.fn();

    render(
      <ValidationFeedback
        validationResult={failureResult}
        onRetry={mockOnRetry}
        isValidating={true}
      />
    );

    // When validating, should show loading indicator instead of retry button
    expect(screen.getByText('Validating...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should render without retry button when onRetry is not provided', () => {
    const failureResult: ValidationResult = {
      success: false,
      message: 'Validation failed',
      details: [],
      suggestions: []
    };

    render(<ValidationFeedback validationResult={failureResult} />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should display suggestions in a highlighted box', () => {
    const failureResult: ValidationResult = {
      success: false,
      message: 'Validation failed',
      details: [],
      suggestions: ['Suggestion 1', 'Suggestion 2']
    };

    const { container } = render(<ValidationFeedback validationResult={failureResult} />);

    const suggestionsBox = container.querySelector('.validation-suggestions');
    expect(suggestionsBox).toBeInTheDocument();
    expect(suggestionsBox).toHaveStyle({ backgroundColor: 'rgb(255, 243, 205)' });
    
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
  });
});
