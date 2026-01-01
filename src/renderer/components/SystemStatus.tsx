import React, { useState, useEffect } from 'react';
import { SystemHealthCheck, SystemHealth } from '../../services/SystemHealthCheck';

interface SystemStatusProps {
  healthCheck: SystemHealthCheck;
  onRefresh?: () => void;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ healthCheck, onRefresh }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const result = await healthCheck.checkHealth(true);
      setHealth(result);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRefresh = async () => {
    await checkHealth();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!health) {
    return null;
  }

  const hasIssues = !health.kubernetes.available || !health.docker.available;

  return (
    <div
      style={{
        backgroundColor: hasIssues ? '#fff3cd' : '#d4edda',
        border: `1px solid ${hasIssues ? '#ffc107' : '#28a745'}`,
        borderRadius: '4px',
        padding: '10px 15px',
        margin: '10px 0',
        fontSize: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>
            {hasIssues ? '⚠️' : '✓'}
          </span>
          <span style={{ fontWeight: 'bold' }}>
            System Status: {hasIssues ? 'Issues Detected' : 'All Systems Operational'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: '1px solid #666',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isChecking}
            style={{
              padding: '5px 10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            {isChecking ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>
                {health.kubernetes.available ? '✓' : '✗'}
              </span>
              <strong>Kubernetes:</strong>
              <span style={{ color: health.kubernetes.available ? '#28a745' : '#dc3545' }}>
                {health.kubernetes.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {health.kubernetes.error && (
              <div style={{ marginLeft: '24px', color: '#666', fontSize: '12px' }}>
                {health.kubernetes.error}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>
                {health.docker.available ? '✓' : '✗'}
              </span>
              <strong>Docker:</strong>
              <span style={{ color: health.docker.available ? '#28a745' : '#dc3545' }}>
                {health.docker.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {health.docker.error && (
              <div style={{ marginLeft: '24px', color: '#666', fontSize: '12px' }}>
                {health.docker.error}
              </div>
            )}
          </div>

          {hasIssues && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
              <strong>Suggestions:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                {healthCheck.getHealthSuggestions(health).map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
