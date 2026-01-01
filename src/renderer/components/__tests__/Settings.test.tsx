import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../Settings';
import { ConfigService } from '../../../services/ConfigService';
import '@testing-library/jest-dom';

describe('Settings Component', () => {
  let configService: ConfigService;

  beforeEach(() => {
    // Reset config to defaults before each test
    const defaultConfig = {
      kubernetesContext: undefined,
      dockerHost: undefined,
      validationTimeout: 30000,
      theme: 'light' as const,
      debugMode: false
    };
    
    // Clear any existing config
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    configService = new ConfigService();
    // Ensure we start with default config
    configService.updateConfig(defaultConfig);
  });

  test('renders settings sections', () => {
    render(<Settings configService={configService} />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes Configuration')).toBeInTheDocument();
    expect(screen.getByText('Docker Configuration')).toBeInTheDocument();
    expect(screen.getByText('Validation Configuration')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  test('displays current configuration values', () => {
    render(<Settings configService={configService} />);
    
    const timeoutInput = screen.getByLabelText('Validation Timeout (milliseconds)') as HTMLInputElement;
    expect(timeoutInput.value).toBe('30000');
    
    const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
    expect(themeSelect.value).toBe('light');
    
    const debugCheckbox = screen.getByLabelText('Debug Mode') as HTMLInputElement;
    expect(debugCheckbox.checked).toBe(false);
  });

  test('shows save button when changes are made', () => {
    render(<Settings configService={configService} />);
    
    // Initially no save button
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    
    // Make a change
    const timeoutInput = screen.getByLabelText('Validation Timeout (milliseconds)');
    fireEvent.change(timeoutInput, { target: { value: '60000' } });
    
    // Save button should appear
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  test('saves configuration changes', () => {
    render(<Settings configService={configService} />);
    
    // Change timeout
    const timeoutInput = screen.getByLabelText('Validation Timeout (milliseconds)');
    fireEvent.change(timeoutInput, { target: { value: '60000' } });
    
    // Change theme
    const themeSelect = screen.getByLabelText('Theme');
    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    
    // Enable debug mode
    const debugCheckbox = screen.getByLabelText('Debug Mode');
    fireEvent.click(debugCheckbox);
    
    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Verify config was updated
    const config = configService.getConfig();
    expect(config.validationTimeout).toBe(60000);
    expect(config.theme).toBe('dark');
    expect(config.debugMode).toBe(true);
  });

  test('resets changes when reset button is clicked', () => {
    render(<Settings configService={configService} />);
    
    // Make a change
    const timeoutInput = screen.getByLabelText('Validation Timeout (milliseconds)') as HTMLInputElement;
    fireEvent.change(timeoutInput, { target: { value: '60000' } });
    
    // Verify change is reflected
    expect(timeoutInput.value).toBe('60000');
    
    // Click reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // Value should be back to original
    expect(timeoutInput.value).toBe('30000');
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Settings configService={configService} onClose={onClose} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('allows setting kubernetes context', () => {
    render(<Settings configService={configService} />);
    
    const contextInput = screen.getByLabelText('Kubernetes Context');
    fireEvent.change(contextInput, { target: { value: 'minikube' } });
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(configService.getKubernetesContext()).toBe('minikube');
  });

  test('allows setting docker host', () => {
    render(<Settings configService={configService} />);
    
    const dockerHostInput = screen.getByLabelText('Docker Host');
    fireEvent.change(dockerHostInput, { target: { value: 'unix:///var/run/docker.sock' } });
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(configService.getDockerHost()).toBe('unix:///var/run/docker.sock');
  });
});
