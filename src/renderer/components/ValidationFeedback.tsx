import React from 'react';
import { ValidationResult } from '../../types';
import LoadingIndicator from './LoadingIndicator';

interface ValidationFeedbackProps {
  validationResult: ValidationResult;
  onRetry?: () => void;
  isValidating?: boolean;
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validationResult,
  onRetry,
  isValidating = false
}) => {
  const { success, message, details, suggestions } = validationResult;

  // Show loading indicator if validation is in progress
  if (isValidating) {
    return (
      <div
        className="validation-feedback validation-feedback-loading"
        style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '2px solid #2196F3',
          borderRadius: '8px'
        }}
      >
        <LoadingIndicator inline text="Validating..." size="small" />
      </div>
    );
  }

  return (
    <div
      className="validation-feedback"
      style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: success ? '#e8f5e9' : '#ffebee',
        border: `2px solid ${success ? '#4CAF50' : '#f44336'}`,
        borderRadius: '8px'
      }}
    >
      {/* Status Header */}
      <div
        className="validation-status"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}
      >
        <span
          style={{
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {success ? '✓' : '✗'}
        </span>
        <h4
          style={{
            margin: 0,
            color: success ? '#2e7d32' : '#c62828',
            fontSize: '18px'
          }}
        >
          {success ? 'Validation Passed' : 'Validation Failed'}
        </h4>
      </div>

      {/* Main Message */}
      <div
        className="validation-message"
        style={{
          marginBottom: details.length > 0 ? '15px' : '10px',
          fontSize: '14px',
          color: '#333'
        }}
      >
        {message}
      </div>

      {/* Error Details */}
      {details.length > 0 && (
        <div
          className="validation-details"
          style={{
            marginBottom: suggestions.length > 0 ? '15px' : '10px'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
            Details:
          </strong>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              listStyleType: 'disc'
            }}
          >
            {details.map((detail, index) => {
              const isFailed = detail.startsWith('FAILED:');
              return (
                <li
                  key={index}
                  className={isFailed ? 'error-detail' : 'success-detail'}
                  style={{
                    marginBottom: '5px',
                    color: isFailed ? '#c62828' : '#2e7d32',
                    fontWeight: isFailed ? 'bold' : 'normal'
                  }}
                >
                  {detail}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div
          className="validation-suggestions"
          style={{
            marginBottom: onRetry ? '15px' : '0',
            padding: '15px',
            backgroundColor: success ? '#e3f2fd' : '#fff3cd',
            border: `2px solid ${success ? '#2196F3' : '#ffc107'}`,
            borderRadius: '6px'
          }}
        >
          <strong
            style={{
              display: 'block',
              marginBottom: '12px',
              color: success ? '#1565c0' : '#856404',
              fontSize: '16px'
            }}
          >
            {success ? '💡 Next Steps:' : '💡 How to Fix:'}
          </strong>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: success ? '#1565c0' : '#856404'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{
                  marginBottom: suggestion.trim() === '' ? '8px' : '2px'
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry Button */}
      {onRetry && !success && !isValidating && (
        <button
          onClick={onRetry}
          className="retry-button"
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
        >
          Retry Validation
        </button>
      )}
    </div>
  );
};

export default ValidationFeedback;
