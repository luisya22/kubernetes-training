import React, { useState, useEffect } from 'react';
import { Exercise, ValidationResult } from '../../types';
import ValidationFeedback from './ValidationFeedback';
import StatusIndicator from './StatusIndicator';

interface ExerciseInterfaceProps {
  exerciseId?: string;
  contentManager?: any;
  progressTracker?: any;
  validationEngine?: any;
  dockerClient?: any;
  onExerciseComplete?: (exerciseId: string) => void;
}

type ExerciseStatus = 'completed' | 'in-progress' | 'locked';

interface StepState {
  completed: boolean;
  validationResult?: ValidationResult;
  showHints: boolean;
}

const ExerciseInterface: React.FC<ExerciseInterfaceProps> = ({ 
  exerciseId, 
  contentManager,
  progressTracker,
  validationEngine,
  dockerClient,
  onExerciseComplete
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepStates, setStepStates] = useState<Map<string, StepState>>(new Map());
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Load exercises on mount
  useEffect(() => {
    if (contentManager) {
      try {
        const allExercises = contentManager.getAllExercises();
        setExercises(allExercises);
        
        // If exerciseId is provided, select that exercise
        if (exerciseId) {
          const exercise = contentManager.getExercise(exerciseId);
          if (exercise) {
            setSelectedExercise(exercise);
            initializeStepStates(exercise);
          }
        }
        
        // Clear any previous system errors
        setSystemError(null);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setSystemError('Failed to load exercises. Please refresh the application.');
      }
    }
  }, [contentManager, exerciseId]);

  const initializeStepStates = (exercise: Exercise) => {
    const states = new Map<string, StepState>();
    exercise.steps.forEach(step => {
      states.set(step.id, {
        completed: false,
        showHints: false
      });
    });
    setStepStates(states);
    setCurrentStepIndex(0);
  };

  const getExerciseStatus = (exercise: Exercise): ExerciseStatus => {
    if (!progressTracker) return 'in-progress';
    
    const progress = progressTracker.getProgress();
    
    // Check if completed
    if (progress.completedExercises.includes(exercise.id)) {
      return 'completed';
    }
    
    // Check if unlocked
    if (!progressTracker.isUnlocked(exercise.id)) {
      return 'locked';
    }
    
    return 'in-progress';
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    const status = getExerciseStatus(exercise);
    if (status === 'locked') {
      return; // Don't allow selecting locked exercises
    }
    
    setSelectedExercise(exercise);
    initializeStepStates(exercise);
  };

  const handleValidateStep = async (stepIndex: number) => {
    if (!selectedExercise || !validationEngine) return;
    
    const step = selectedExercise.steps[stepIndex];
    const criteria = selectedExercise.validationCriteria[stepIndex];
    
    setIsValidating(true);
    setSystemError(null); // Clear any previous system errors
    
    try {
      const result = await validationEngine.validateStep(step.id, criteria);
      
      // Update step state with validation result
      const newStates = new Map(stepStates);
      newStates.set(step.id, {
        ...newStates.get(step.id)!,
        completed: result.success,
        validationResult: result
      });
      setStepStates(newStates);
      
      // Reset retry count on successful validation attempt
      setRetryCount(0);
      
      // If validation succeeded, move to next step or complete exercise
      if (result.success) {
        if (stepIndex < selectedExercise.steps.length - 1) {
          setCurrentStepIndex(stepIndex + 1);
        } else {
          // All steps completed, mark exercise as complete
          if (progressTracker) {
            progressTracker.recordCompletion(selectedExercise.id, 'exercise');
          }
          if (onExerciseComplete) {
            onExerciseComplete(selectedExercise.id);
          }
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Handle specific error types
      let errorMessage = 'An error occurred during validation. ';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('cluster') || message.includes('kubernetes')) {
          errorMessage = 'Cannot connect to Kubernetes cluster. Please ensure your cluster is running and try again.';
        } else if (message.includes('docker')) {
          errorMessage = 'Cannot connect to Docker. Please ensure Docker is running and try again.';
        } else if (message.includes('network') || message.includes('timeout')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else {
          errorMessage += error.message;
        }
      }
      
      setSystemError(errorMessage);
      
      // Create a failed validation result for display
      const failedResult: ValidationResult = {
        success: false,
        message: 'Validation failed due to system error',
        details: [errorMessage],
        suggestions: [
          'Check that all required services are running',
          'Verify your system configuration',
          'Try again in a moment'
        ]
      };
      
      const newStates = new Map(stepStates);
      newStates.set(step.id, {
        ...newStates.get(step.id)!,
        completed: false,
        validationResult: failedResult
      });
      setStepStates(newStates);
    } finally {
      setIsValidating(false);
    }
  };

  const handleToggleHints = (stepId: string) => {
    const newStates = new Map(stepStates);
    const currentState = newStates.get(stepId);
    if (currentState) {
      newStates.set(stepId, {
        ...currentState,
        showHints: !currentState.showHints
      });
      setStepStates(newStates);
    }
  };

  const isStepAccessible = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true;
    
    // Step is accessible if previous step is completed
    if (selectedExercise) {
      const previousStep = selectedExercise.steps[stepIndex - 1];
      const previousState = stepStates.get(previousStep.id);
      return previousState?.completed || false;
    }
    
    return false;
  };

  const getCompletionStats = () => {
    if (!progressTracker) return { completed: 0, total: exercises.length, locked: 0 };
    const progress = progressTracker.getProgress();
    const completed = exercises.filter(ex => progress.completedExercises.includes(ex.id)).length;
    const locked = exercises.filter(ex => !progressTracker.isUnlocked(ex.id)).length;
    return { completed, total: exercises.length, locked };
  };

  const renderExerciseList = () => {
    const stats = getCompletionStats();
    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    return (
      <div className="exercise-list">
        <h3>Exercises</h3>
        
        {/* Completion Progress Bar */}
        {exercises.length > 0 && (
          <div style={{
            margin: '15px 0',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                Progress
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4CAF50' }}>
                {stats.completed} / {stats.total}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>
            <div style={{
              marginTop: '6px',
              fontSize: '12px',
              color: '#6c757d',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{percentage}% Complete</span>
              {stats.locked > 0 && (
                <span>🔒 {stats.locked} locked</span>
              )}
            </div>
          </div>
        )}
        
        {exercises.map(exercise => {
          const status = getExerciseStatus(exercise);
          return (
            <div
              key={exercise.id}
              className={`exercise-item ${status} ${selectedExercise?.id === exercise.id ? 'selected' : ''}`}
              onClick={() => handleExerciseSelect(exercise)}
              style={{
                padding: '12px',
                margin: '8px 0',
                border: selectedExercise?.id === exercise.id ? '2px solid #2196F3' : '1px solid #e0e0e0',
                borderLeft: status === 'completed' ? '4px solid #4CAF50' : status === 'locked' ? '4px solid #BDBDBD' : '4px solid #2196F3',
                borderRadius: '8px',
                cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                opacity: status === 'locked' ? 0.6 : 1,
                backgroundColor: selectedExercise?.id === exercise.id 
                  ? '#E3F2FD' 
                  : status === 'completed' 
                    ? '#F1F8F4' 
                    : 'white',
                transition: 'all 0.2s ease',
                boxShadow: selectedExercise?.id === exercise.id ? '0 2px 8px rgba(33, 150, 243, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <StatusIndicator status={status} size="medium" />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {exercise.title}
                    {status === 'completed' && (
                      <span style={{
                        fontSize: '11px',
                        color: '#4CAF50',
                        fontWeight: '600',
                        backgroundColor: '#E8F5E9',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid #4CAF50'
                      }}>
                        ✓ Completed
                      </span>
                    )}
                    {status === 'locked' && (
                      <span style={{
                        fontSize: '11px',
                        color: '#757575',
                        fontWeight: '600',
                        backgroundColor: '#F5F5F5',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid #BDBDBD'
                      }}>
                        🔒 Locked
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666', lineHeight: '1.4' }}>
                    {exercise.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepView = () => {
    if (!selectedExercise) {
      return (
        <div className="no-exercise-selected">
          <p>Select an exercise to begin</p>
        </div>
      );
    }

    const currentStep = selectedExercise.steps[currentStepIndex];
    const stepState = stepStates.get(currentStep.id);

    return (
      <div className="step-view">
        <h3>{selectedExercise.title}</h3>
        <p>{selectedExercise.description}</p>
        
        {/* Resources Section */}
        {selectedExercise.resources && selectedExercise.resources.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ marginTop: 0, color: '#2196F3' }}>📚 Resources</h4>
            {selectedExercise.resources.map((resource, idx) => (
              <div key={idx} style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {resource.type === 'yaml' && '📄'}
                  {resource.type === 'info' && 'ℹ️'}
                  {resource.type === 'commands' && '⌨️'}
                  {resource.type === 'dockerfile' && '🐳'}
                  {resource.name}
                </div>
                <pre style={{
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '13px',
                  margin: 0
                }}>
                  {resource.content}
                </pre>
              </div>
            ))}
          </div>
        )}
        
        <div className="step-progress">
          Step {currentStepIndex + 1} of {selectedExercise.steps.length}
        </div>

        {selectedExercise.steps.map((step, index) => {
          const state = stepStates.get(step.id);
          const accessible = isStepAccessible(index);
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`step ${isCurrent ? 'current' : ''} ${!accessible ? 'locked' : ''}`}
              style={{
                padding: '15px',
                margin: '10px 0',
                border: isCurrent ? '2px solid #2196F3' : '1px solid #ccc',
                borderRadius: '4px',
                opacity: accessible ? 1 : 0.5,
                backgroundColor: state?.completed ? '#e8f5e9' : 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
                  {state?.completed ? '✓' : index + 1}
                </span>
                <h4 style={{ margin: 0 }}>Step {index + 1}</h4>
              </div>

              {/* Always show instruction and expected outcome for all steps */}
              <div className="instruction" style={{ marginBottom: '10px' }}>
                <strong>Instructions:</strong>
                <p>{step.instruction}</p>
              </div>

              <div className="expected-outcome" style={{ marginBottom: '10px' }}>
                <strong>Expected Outcome:</strong>
                <p>{step.expectedOutcome}</p>
              </div>

              {/* Only show interactive elements for accessible steps */}
              {accessible && (
                <>
                  {step.hints && step.hints.length > 0 && (
                    <div className="hints" style={{ marginBottom: '10px' }}>
                      <button
                        onClick={() => handleToggleHints(step.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#FFC107',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {state?.showHints ? 'Hide Hints' : 'Show Hints'}
                      </button>
                      
                      {state?.showHints && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#FFF9C4', borderRadius: '4px' }}>
                          {step.hints.map((hint, hintIndex) => (
                            <div key={hintIndex} style={{ marginBottom: '5px' }}>
                              💡 {hint}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isCurrent && !state?.completed && (
                    <button
                      onClick={() => handleValidateStep(index)}
                      disabled={isValidating}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: isValidating ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isValidating ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {isValidating ? 'Validating...' : 'Validate Step'}
                    </button>
                  )}

                  {state?.validationResult && (
                    <ValidationFeedback
                      validationResult={state.validationResult}
                      onRetry={() => handleValidateStep(index)}
                      isValidating={isValidating}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="exercise-interface" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {/* System Error Banner */}
      {systemError && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          padding: '15px 20px',
          maxWidth: '600px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#c62828' }}>System Error</strong>
              <p style={{ margin: '5px 0 0 0', color: '#333' }}>{systemError}</p>
            </div>
            <button
              onClick={() => setSystemError(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          {retryCount > 2 && (
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
              Multiple validation attempts failed. Consider checking your system configuration.
            </p>
          )}
        </div>
      )}
      
      <div style={{ flex: '0 0 300px' }}>
        {renderExerciseList()}
      </div>
      <div style={{ flex: 1 }}>
        {renderStepView()}
      </div>
    </div>
  );
};

export default ExerciseInterface;
