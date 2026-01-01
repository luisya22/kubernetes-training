import React from 'react';

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  inline?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  size = 'medium',
  text,
  inline = false
}) => {
  const sizeStyles = {
    small: { width: '16px', height: '16px', borderWidth: '2px' },
    medium: { width: '20px', height: '20px', borderWidth: '3px' },
    large: { width: '32px', height: '32px', borderWidth: '4px' }
  };

  const style = sizeStyles[size];
  const spinnerColor = '#2196F3';
  const spinnerBgColor = '#E3F2FD';

  const spinner = (
    <div
      className="loading-spinner"
      style={{
        width: style.width,
        height: style.height,
        border: `${style.borderWidth} solid ${spinnerBgColor}`,
        borderTop: `${style.borderWidth} solid ${spinnerColor}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        display: 'inline-block'
      }}
      role="status"
      aria-label="Loading"
    />
  );

  if (inline) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {spinner}
        {text && <span>{text}</span>}
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '20px'
      }}
    >
      {spinner}
      {text && (
        <span style={{ color: '#666', fontSize: '14px' }}>{text}</span>
      )}
    </div>
  );
};

export default LoadingIndicator;

