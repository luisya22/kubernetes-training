import React, { useState, useEffect } from 'react';
import LessonViewer from './components/LessonViewer';
import ExerciseInterface from './components/ExerciseInterface';
import ProgressDashboard from './components/ProgressDashboard';
import SetupWizard from './components/SetupWizard';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import SystemStatus from './components/SystemStatus';
import { ContentManager } from '../services/ContentManager';
import { ProgressTracker } from '../services/ProgressTracker';
import { ValidationEngine } from '../services/ValidationEngine';
import { KubernetesClient } from '../services/KubernetesClient';
import { DockerClient } from '../services/DockerClient';
import { SetupService } from '../services/SetupService';
import { SystemHealthCheck } from '../services/SystemHealthCheck';
import { ConfigService } from '../services/ConfigService';

type ViewType = 'lessons' | 'exercises' | 'progress' | 'settings';

const App: React.FC = () => {
  const [configService] = useState(() => new ConfigService());
  const [contentManager] = useState(() => new ContentManager());
  const [progressTracker] = useState(() => new ProgressTracker(undefined, contentManager));
  const [kubernetesClient] = useState(() => new KubernetesClient());
  const [dockerClient] = useState(() => new DockerClient());
  const [validationEngine] = useState(() => new ValidationEngine(kubernetesClient, dockerClient, configService));
  const [setupService] = useState(() => new SetupService());
  const [healthCheck] = useState(() => new SystemHealthCheck(kubernetesClient, dockerClient));
  
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewType>('lessons');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>();
  const [showSystemStatus, setShowSystemStatus] = useState<boolean>(true);

  useEffect(() => {
    // Check if setup is needed on mount
    const checkSetup = async () => {
      if (!setupService.isSetupCompleted()) {
        setShowSetup(true);
      } else {
        // Perform initial health check
        try {
          await healthCheck.checkHealth();
        } catch (error) {
          console.error('Initial health check failed:', error);
        }
      }
    };
    checkSetup();

    // Apply theme on mount
    const theme = configService.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, [setupService, healthCheck, configService]);

  const handleSetupComplete = () => {
    setShowSetup(false);
    // Refresh health check after setup
    healthCheck.clearCache();
    healthCheck.checkHealth();
  };

  const handleSetupSkip = () => {
    setShowSetup(false);
  };

  const handleHealthRefresh = () => {
    // Reset validation engine cache when health is refreshed
    validationEngine.resetAvailabilityCache();
  };

  const handleLessonComplete = (lessonId: string) => {
    progressTracker.recordCompletion(lessonId, 'lesson');
  };

  const handleNavigateToExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setCurrentView('exercises');
  };

  const handleExerciseComplete = (exerciseId: string) => {
    progressTracker.recordCompletion(exerciseId, 'exercise');
  };

  if (showSetup) {
    return (
      <SetupWizard
        setupService={setupService}
        onSetupComplete={handleSetupComplete}
        onSkip={handleSetupSkip}
      />
    );
  }

  return (
    <ErrorBoundary onReset={handleHealthRefresh}>
      <div className="app" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation */}
        <nav style={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          padding: '10px 20px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setCurrentView('lessons')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'lessons' ? '#2196F3' : 'white',
              color: currentView === 'lessons' ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: currentView === 'lessons' ? 'bold' : 'normal'
            }}
          >
            Lessons
          </button>
          <button
            onClick={() => setCurrentView('exercises')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'exercises' ? '#2196F3' : 'white',
              color: currentView === 'exercises' ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: currentView === 'exercises' ? 'bold' : 'normal'
            }}
          >
            Exercises
          </button>
          <button
            onClick={() => setCurrentView('progress')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'progress' ? '#2196F3' : 'white',
              color: currentView === 'progress' ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: currentView === 'progress' ? 'bold' : 'normal'
            }}
          >
            Progress
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'settings' ? '#2196F3' : 'white',
              color: currentView === 'settings' ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: currentView === 'settings' ? 'bold' : 'normal'
            }}
          >
            Settings
          </button>
          
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setShowSystemStatus(!showSystemStatus)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showSystemStatus ? 'Hide' : 'Show'} System Status
            </button>
          </div>
        </nav>

        {/* System Status */}
        {showSystemStatus && (
          <div style={{ padding: '0 20px' }}>
            <SystemStatus healthCheck={healthCheck} onRefresh={handleHealthRefresh} />
          </div>
        )}

        {/* Main Content */}
        <ErrorBoundary>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {currentView === 'lessons' && (
              <LessonViewer
                contentManager={contentManager}
                progressTracker={progressTracker}
                onLessonComplete={handleLessonComplete}
                onNavigateToExercise={handleNavigateToExercise}
              />
            )}
            {currentView === 'exercises' && (
              <ExerciseInterface
                exerciseId={selectedExerciseId}
                contentManager={contentManager}
                progressTracker={progressTracker}
                validationEngine={validationEngine}
                dockerClient={dockerClient}
                onExerciseComplete={handleExerciseComplete}
              />
            )}
            {currentView === 'progress' && (
              <ProgressDashboard
                contentManager={contentManager}
                progressTracker={progressTracker}
              />
            )}
            {currentView === 'settings' && (
              <Settings
                configService={configService}
                onClose={() => setCurrentView('lessons')}
              />
            )}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default App;
