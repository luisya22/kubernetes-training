import React, { useState, useEffect } from 'react';
import { DifficultyLevel, Lesson, Exercise, Progress } from '../../types';

interface IContentManager {
  getLessons(level: DifficultyLevel): Lesson[];
  getAllLessons(): Lesson[];
  getLesson(id: string): Lesson | null;
  getExercise(id: string): Exercise | null;
  getExercisesByLesson(lessonId: string): Exercise[];
  getAllExercises(): Exercise[];
}

interface IProgressTracker {
  getProgress(): Progress;
  isUnlocked(itemId: string): boolean;
  recordCompletion(itemId: string, itemType: 'lesson' | 'exercise'): void;
  resetProgress(scope: 'all' | 'exercise', itemId?: string): void;
}

interface ProgressDashboardProps {
  contentManager: IContentManager;
  progressTracker: IProgressTracker;
}

interface LevelStats {
  total: number;
  completed: number;
  percentage: number;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  contentManager,
  progressTracker
}) => {
  const [progress, setProgress] = useState(progressTracker.getProgress());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    // Refresh progress when component mounts or updates
    setProgress(progressTracker.getProgress());
  }, [progressTracker]);

  // Calculate statistics for each difficulty level
  const calculateLevelStats = (level: DifficultyLevel): LevelStats => {
    const lessons = contentManager.getLessons(level);
    const allExercises: Exercise[] = [];
    
    lessons.forEach(lesson => {
      const exercises = contentManager.getExercisesByLesson(lesson.id);
      allExercises.push(...exercises);
    });

    const completedExercises = allExercises.filter(ex => 
      progress.completedExercises.includes(ex.id)
    );

    const total = allExercises.length;
    const completed = completedExercises.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  };

  const beginnerStats = calculateLevelStats('beginner');
  const intermediateStats = calculateLevelStats('intermediate');
  const advancedStats = calculateLevelStats('advanced');

  // Calculate overall statistics
  const totalExercises = beginnerStats.total + intermediateStats.total + advancedStats.total;
  const totalCompleted = beginnerStats.completed + intermediateStats.completed + advancedStats.completed;
  const overallPercentage = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;

  const handleResetAll = () => {
    if (showResetConfirm) {
      progressTracker.resetProgress('all');
      setProgress(progressTracker.getProgress());
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleResetExercise = (exerciseId: string) => {
    progressTracker.resetProgress('exercise', exerciseId);
    setProgress(progressTracker.getProgress());
  };

  // Get recently completed items
  const getRecentCompletions = () => {
    const items: Array<{ id: string; type: 'lesson' | 'exercise'; timestamp: Date }> = [];
    
    progress.completedLessons.forEach(lessonId => {
      const timestamp = progress.timestamps.get(lessonId);
      if (timestamp) {
        items.push({ id: lessonId, type: 'lesson', timestamp });
      }
    });

    progress.completedExercises.forEach(exerciseId => {
      const timestamp = progress.timestamps.get(exerciseId);
      if (timestamp) {
        items.push({ id: exerciseId, type: 'exercise', timestamp });
      }
    });

    // Sort by timestamp descending (most recent first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return items.slice(0, 5); // Return top 5 most recent
  };

  const recentCompletions = getRecentCompletions();

  return (
    <div className="progress-dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Progress Dashboard</h2>

      {/* Overall Progress */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Overall Progress</h3>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Exercises Completed</span>
            <span><strong>{totalCompleted} / {totalExercises}</strong></span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            backgroundColor: '#ddd', 
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${overallPercentage}%`, 
              height: '100%', 
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: '5px', fontSize: '14px', color: '#666' }}>
            {overallPercentage}% Complete
          </div>
        </div>
        <div style={{ marginTop: '15px' }}>
          <div><strong>Current Level:</strong> {progress.currentLevel.charAt(0).toUpperCase() + progress.currentLevel.slice(1)}</div>
          <div><strong>Lessons Completed:</strong> {progress.completedLessons.length}</div>
        </div>
      </div>

      {/* Level Progression */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Level Progression</h3>
        
        {/* Beginner Level */}
        <div style={{ 
          backgroundColor: '#e8f5e9', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '10px',
          border: progress.currentLevel === 'beginner' ? '2px solid #4caf50' : '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Beginner</h4>
            <span>{beginnerStats.completed} / {beginnerStats.total} exercises</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: '#c8e6c9', 
            borderRadius: '5px',
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${beginnerStats.percentage}%`, 
              height: '100%', 
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Intermediate Level */}
        <div style={{ 
          backgroundColor: '#fff3e0', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '10px',
          border: progress.currentLevel === 'intermediate' ? '2px solid #ff9800' : '1px solid #ddd',
          opacity: progress.currentLevel === 'beginner' ? 0.6 : 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Intermediate</h4>
            <span>{intermediateStats.completed} / {intermediateStats.total} exercises</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: '#ffe0b2', 
            borderRadius: '5px',
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${intermediateStats.percentage}%`, 
              height: '100%', 
              backgroundColor: '#ff9800',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Advanced Level */}
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '10px',
          border: progress.currentLevel === 'advanced' ? '2px solid #2196f3' : '1px solid #ddd',
          opacity: progress.currentLevel !== 'advanced' ? 0.6 : 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Advanced</h4>
            <span>{advancedStats.completed} / {advancedStats.total} exercises</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: '#bbdefb', 
            borderRadius: '5px',
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${advancedStats.percentage}%`, 
              height: '100%', 
              backgroundColor: '#2196f3',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Recent Completions */}
      {recentCompletions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Recent Completions</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
            {recentCompletions.map((item, index) => {
              const itemData = item.type === 'lesson' 
                ? contentManager.getLesson(item.id)
                : contentManager.getExercise(item.id);
              
              if (!itemData) return null;

              return (
                <div 
                  key={`${item.type}-${item.id}`}
                  style={{ 
                    padding: '10px',
                    borderBottom: index < recentCompletions.length - 1 ? '1px solid #ddd' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {item.type === 'lesson' ? '📚' : '✏️'} {itemData.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {item.type === 'exercise' && (
                    <button
                      onClick={() => handleResetExercise(item.id)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset Functionality */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #ddd' }}>
        <h3>Reset Progress</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Reset your progress to start over. This action cannot be undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={handleResetAll}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reset All Progress
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleResetAll}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Confirm Reset
            </button>
            <button
              onClick={handleCancelReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;
