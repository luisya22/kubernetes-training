import React, { useState, useEffect } from 'react';
import { SetupService, SetupStatus } from '../../services/SetupService';
import LoadingIndicator from './LoadingIndicator';

interface SetupWizardProps {
  setupService: SetupService;
  onSetupComplete: () => void;
  onSkip?: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({
  setupService,
  onSetupComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState<'check' | 'instructions' | 'complete'>('check');
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [instructions, setInstructions] = useState<string>('');
  const [osType, setOsType] = useState<string>('');

  useEffect(() => {
    // Load instructions
    const instructionsText = setupService.getInstallationInstructions();
    setInstructions(instructionsText);
    setOsType(setupService.getOS());

    // Run initial check
    performCheck();
  }, [setupService]);

  const performCheck = async () => {
    setIsChecking(true);
    try {
      const status = await setupService.runSetupCheck();
      setSetupStatus(status);
      
      if (status.setupCompleted) {
        // Auto-complete if everything is ready
        setTimeout(() => {
          handleComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('Setup check failed:', error);
      setSetupStatus({
        kubectlInstalled: false,
        clusterAvailable: false,
        setupCompleted: false,
        error: 'Setup check failed. Please try again.'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    setCurrentStep('check');
    performCheck();
  };

  const handleViewInstructions = () => {
    setCurrentStep('instructions');
  };

  const handleComplete = () => {
    setupService.markSetupCompleted();
    onSetupComplete();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // Still mark as completed even if skipped
      setupService.markSetupCompleted();
      onSetupComplete();
    }
  };

  if (currentStep === 'instructions') {
    return (
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px' }}>Kubernetes Installation Instructions</h2>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '20px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.6',
            maxHeight: '500px',
            overflowY: 'auto'
          }}
        >
          {instructions}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRetry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Check Again
          </button>
          <button
            onClick={handleSkip}
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
            Skip Setup
          </button>
        </div>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '40px'
      }}>
        <LoadingIndicator size="large" text="Checking your setup..." />
      </div>
    );
  }

  if (!setupStatus) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Unable to perform setup check. Please try again.</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  const allChecksPassed = setupStatus.kubectlInstalled && setupStatus.clusterAvailable;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>
        Welcome to Kubernetes Training
      </h1>
      <h2 style={{ marginBottom: '20px' }}>Setup Check</h2>

      <div style={{ marginBottom: '30px' }}>
        {/* Kubectl Check */}
        <div
          style={{
            padding: '20px',
            marginBottom: '15px',
            borderRadius: '8px',
            border: `2px solid ${setupStatus.kubectlInstalled ? '#4CAF50' : '#f44336'}`,
            backgroundColor: setupStatus.kubectlInstalled ? '#e8f5e9' : '#ffebee'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>
              {setupStatus.kubectlInstalled ? '✓' : '✗'}
            </span>
            <h3 style={{ margin: 0 }}>kubectl Installation</h3>
          </div>
          {setupStatus.kubectlInstalled ? (
            <div>
              <p style={{ margin: '5px 0', color: '#2e7d32' }}>
                kubectl is installed
                {setupStatus.kubectlVersion && ` (version ${setupStatus.kubectlVersion})`}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '5px 0', color: '#c62828' }}>
                kubectl is not installed or not found in PATH
              </p>
              {setupStatus.error && (
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  {setupStatus.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cluster Check */}
        <div
          style={{
            padding: '20px',
            marginBottom: '15px',
            borderRadius: '8px',
            border: `2px solid ${setupStatus.clusterAvailable ? '#4CAF50' : '#f44336'}`,
            backgroundColor: setupStatus.clusterAvailable ? '#e8f5e9' : '#ffebee'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>
              {setupStatus.clusterAvailable ? '✓' : '✗'}
            </span>
            <h3 style={{ margin: 0 }}>Kubernetes Cluster</h3>
          </div>
          {setupStatus.clusterAvailable ? (
            <div>
              <p style={{ margin: '5px 0', color: '#2e7d32' }}>
                Cluster is available and accessible
                {setupStatus.clusterInfo && ` (${setupStatus.clusterInfo})`}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '5px 0', color: '#c62828' }}>
                Kubernetes cluster is not available
              </p>
              {setupStatus.error && (
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  {setupStatus.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {allChecksPassed ? (
          <button
            onClick={handleComplete}
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
            Continue to Application
          </button>
        ) : (
          <>
            <button
              onClick={handleViewInstructions}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              View Installation Instructions
            </button>
            <button
              onClick={handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Check Again
            </button>
            <button
              onClick={handleSkip}
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
              Skip Setup
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;

