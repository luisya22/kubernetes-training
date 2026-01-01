import React, { useState, useEffect } from 'react';
import { ConfigService } from '../../services/ConfigService';
import { AppConfig } from '../../types';

interface SettingsProps {
  configService: ConfigService;
  onClose?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ configService, onClose }) => {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setConfig(configService.getConfig());
  }, [configService]);

  const handleChange = (field: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    configService.updateConfig(config);
    // Apply theme immediately
    if (config.theme) {
      document.documentElement.setAttribute('data-theme', config.theme);
    }
    setHasChanges(false);
    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    setConfig(configService.getConfig());
    setHasChanges(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: 'var(--accent-color)' }}>Settings</h1>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Kubernetes Configuration */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-primary)' }}>Kubernetes Configuration</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="kubernetes-context" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Kubernetes Context
          </label>
          <input
            id="kubernetes-context"
            type="text"
            value={config.kubernetesContext || ''}
            onChange={(e) => handleChange('kubernetesContext', e.target.value || undefined)}
            placeholder="default (uses current context)"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color-light)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
            Leave empty to use the current kubectl context
          </p>
        </div>
      </div>

      {/* Docker Configuration */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-primary)' }}>Docker Configuration</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="docker-host" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Docker Host
          </label>
          <input
            id="docker-host"
            type="text"
            value={config.dockerHost || ''}
            onChange={(e) => handleChange('dockerHost', e.target.value || undefined)}
            placeholder="default (uses local Docker socket)"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color-light)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
            Docker daemon connection string (e.g., unix:///var/run/docker.sock)
          </p>
        </div>
      </div>

      {/* Validation Configuration */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-primary)' }}>Validation Configuration</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="validation-timeout" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Validation Timeout (milliseconds)
          </label>
          <input
            id="validation-timeout"
            type="number"
            value={config.validationTimeout}
            onChange={(e) => handleChange('validationTimeout', parseInt(e.target.value, 10))}
            min="1000"
            max="300000"
            step="1000"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color-light)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
            Maximum time to wait for validation commands to complete (default: 30000ms)
          </p>
        </div>
      </div>

      {/* Appearance Configuration */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-primary)' }}>Appearance</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="theme-select" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Theme
          </label>
          <select
            id="theme-select"
            value={config.theme}
            onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark')}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color-light)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-primary)' }}>Advanced</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="debug-mode" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              id="debug-mode"
              type="checkbox"
              checked={config.debugMode}
              onChange={(e) => handleChange('debugMode', e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Debug Mode</span>
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px', marginLeft: '28px' }}>
            Enable detailed logging and error messages for troubleshooting
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;

