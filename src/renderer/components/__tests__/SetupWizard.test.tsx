import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SetupWizard from '../SetupWizard';
import { SetupService } from '../../../services/SetupService';

// Mock the SetupService
jest.mock('../../../services/SetupService');
jest.mock('../../../services/KubernetesClient');

describe('SetupWizard', () => {
  let mockSetupService: jest.Mocked<SetupService>;
  let mockOnSetupComplete: jest.Mock;
  let mockOnSkip: jest.Mock;

  beforeEach(() => {
    mockSetupService = {
      getInstallationInstructions: jest.fn().mockReturnValue('Mock installation instructions'),
      getOS: jest.fn().mockReturnValue('linux'),
      runSetupCheck: jest.fn(),
      markSetupCompleted: jest.fn(),
      isSetupCompleted: jest.fn().mockReturnValue(false),
      checkKubectlInstalled: jest.fn(),
      checkClusterAvailable: jest.fn()
    } as any;

    mockOnSetupComplete = jest.fn();
    mockOnSkip = jest.fn();
  });

  it('should render loading state initially', () => {
    mockSetupService.runSetupCheck.mockImplementation(() => new Promise(() => {}));
    
    render(
      <SetupWizard
        setupService={mockSetupService}
        onSetupComplete={mockOnSetupComplete}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText(/checking your setup/i)).toBeInTheDocument();
  });

  it('should display setup check results when checks complete', async () => {
    mockSetupService.runSetupCheck.mockResolvedValue({
      kubectlInstalled: true,
      clusterAvailable: false,
      setupCompleted: false,
      kubectlVersion: '1.28.0',
      error: 'Cluster not available'
    });

    render(
      <SetupWizard
        setupService={mockSetupService}
        onSetupComplete={mockOnSetupComplete}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/kubectl installation/i)).toBeInTheDocument();
    });

    // Use getAllByText since there are multiple elements with this text
    const clusterElements = screen.getAllByText(/kubernetes cluster/i);
    expect(clusterElements.length).toBeGreaterThan(0);
  });

  it('should auto-complete when all checks pass', async () => {
    mockSetupService.runSetupCheck.mockResolvedValue({
      kubectlInstalled: true,
      clusterAvailable: true,
      setupCompleted: true,
      kubectlVersion: '1.28.0',
      clusterInfo: 'minikube'
    });

    render(
      <SetupWizard
        setupService={mockSetupService}
        onSetupComplete={mockOnSetupComplete}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(mockSetupService.markSetupCompleted).toHaveBeenCalled();
      expect(mockOnSetupComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should show installation instructions when requested', async () => {
    mockSetupService.runSetupCheck.mockResolvedValue({
      kubectlInstalled: false,
      clusterAvailable: false,
      setupCompleted: false,
      error: 'kubectl not found'
    });

    const { container } = render(
      <SetupWizard
        setupService={mockSetupService}
        onSetupComplete={mockOnSetupComplete}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/view installation instructions/i)).toBeInTheDocument();
    });

    const viewInstructionsButton = screen.getByText(/view installation instructions/i);
    viewInstructionsButton.click();

    await waitFor(() => {
      expect(screen.getByText(/kubernetes installation instructions/i)).toBeInTheDocument();
      expect(screen.getByText(/mock installation instructions/i)).toBeInTheDocument();
    });
  });
});
