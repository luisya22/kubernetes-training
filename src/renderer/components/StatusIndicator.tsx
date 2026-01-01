import React from 'react';

export type StatusType = 'completed' | 'in-progress' | 'locked';

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  size = 'medium',
  showLabel = false
}) => {
  const sizeStyles = {
    small: { 
      fontSize: '12px', 
      width: '20px', 
      height: '20px',
      iconSize: '10px',
      labelSize: '11px'
    },
    medium: { 
      fontSize: '14px', 
      width: '24px', 
      height: '24px',
      iconSize: '12px',
      labelSize: '13px'
    },
    large: { 
      fontSize: '16px', 
      width: '32px', 
      height: '32px',
      iconSize: '16px',
      labelSize: '14px'
    }
  };

  const style = sizeStyles[size];

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: '✓',
          color: '#4CAF50',
          bgColor: '#E8F5E9',
          borderColor: '#4CAF50',
          label: 'Completed'
        };
      case 'locked':
        return {
          icon: '🔒',
          color: '#757575',
          bgColor: '#F5F5F5',
          borderColor: '#BDBDBD',
          label: 'Locked'
        };
      case 'in-progress':
        return {
          icon: '▶',
          color: '#2196F3',
          bgColor: '#E3F2FD',
          borderColor: '#2196F3',
          label: 'In Progress'
        };
      default:
        return {
          icon: '○',
          color: '#9E9E9E',
          bgColor: '#FAFAFA',
          borderColor: '#E0E0E0',
          label: 'Not Started'
        };
    }
  };

  const config = getStatusConfig();

  if (showLabel) {
    return (
      <span
        className={`status-indicator status-indicator-${status} with-label`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: config.bgColor,
          border: `1.5px solid ${config.borderColor}`,
          borderRadius: '12px',
          fontSize: style.labelSize,
          color: config.color,
          fontWeight: '600'
        }}
        aria-label={`Status: ${config.label}`}
      >
        <span style={{ fontSize: style.iconSize }}>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`status-indicator status-indicator-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: style.width,
        height: style.height,
        fontSize: style.fontSize,
        color: config.color,
        backgroundColor: config.bgColor,
        border: `2px solid ${config.borderColor}`,
        borderRadius: '50%',
        fontWeight: 'bold',
        flexShrink: 0
      }}
      aria-label={`Status: ${config.label}`}
      title={config.label}
    >
      {config.icon}
    </span>
  );
};

export default StatusIndicator;

