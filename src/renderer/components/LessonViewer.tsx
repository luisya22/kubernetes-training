import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Lesson, DifficultyLevel, LessonContent, ContentSection, CodeExample } from '../../types';
import { ContentManager } from '../../services/ContentManager';
import { ProgressTracker } from '../../services/ProgressTracker';
import StatusIndicator from './StatusIndicator';

interface LessonViewerProps {
  contentManager: ContentManager;
  progressTracker?: ProgressTracker;
  onLessonComplete?: (lessonId: string) => void;
  onNavigateToExercise?: (exerciseId: string) => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ contentManager, progressTracker, onLessonComplete, onNavigateToExercise }) => {
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('beginner');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Load lessons when level changes
  useEffect(() => {
    try {
      const loadedLessons = contentManager.getLessons(selectedLevel);
      setLessons(loadedLessons);
      setSelectedLesson(null);
      setLessonContent(null);
      setLoadError(null);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setLoadError('Failed to load lessons. Please try again.');
      setLessons([]);
    }
  }, [selectedLevel, contentManager]);

  // Load full lesson content when a lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      try {
        // Parse the lesson content to extract structured data
        const content = parseLessonContent(selectedLesson);
        setLessonContent(content);
        setLoadError(null);
      } catch (error) {
        console.error('Error parsing lesson content:', error);
        setLoadError('Failed to load lesson content. Please try selecting another lesson.');
        setLessonContent(null);
      }
    }
  }, [selectedLesson]);

  const parseLessonContent = (lesson: Lesson): LessonContent => {
    // For now, create a basic structure from the lesson
    // In a real implementation, this would parse the markdown-like content
    return {
      id: lesson.id,
      title: lesson.title,
      level: lesson.level,
      order: 0,
      concepts: lesson.concepts,
      content: {
        introduction: lesson.content.split('\n\n')[0] || '',
        sections: extractSections(lesson.content),
        summary: lesson.content.split('\n\n').slice(-1)[0] || ''
      },
      exercises: lesson.exercises,
      prerequisites: []
    };
  };

  const extractSections = (content: string): ContentSection[] => {
    const sections: ContentSection[] = [];
    const lines = content.split('\n');
    let currentSection: ContentSection | null = null;
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section headers (## Title)
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.substring(3).trim(),
          content: '',
          codeExamples: []
        };
      }
      // Detect code blocks
      else if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.substring(3).trim() || 'text';
          codeContent = '';
        } else {
          inCodeBlock = false;
          if (currentSection && currentSection.codeExamples) {
            currentSection.codeExamples.push({
              language: codeLanguage,
              code: codeContent,
              explanation: ''
            });
          }
        }
      }
      // Accumulate code content
      else if (inCodeBlock) {
        codeContent += line + '\n';
      }
      // Regular content
      else if (currentSection && line.trim()) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Check if this lesson is already completed
    if (progressTracker) {
      const progress = progressTracker.getProgress();
      setIsCompleted(progress.completedLessons.includes(lesson.id));
    } else {
      setIsCompleted(false);
    }
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    if (!progressTracker) return false;
    const progress = progressTracker.getProgress();
    return progress.completedLessons.includes(lessonId);
  };

  const getCompletionStats = () => {
    if (!progressTracker) return { completed: 0, total: lessons.length };
    const progress = progressTracker.getProgress();
    const completed = lessons.filter(lesson => progress.completedLessons.includes(lesson.id)).length;
    return { completed, total: lessons.length };
  };

  const handleMarkComplete = () => {
    if (selectedLesson && onLessonComplete) {
      onLessonComplete(selectedLesson.id);
      setIsCompleted(true);
    }
  };

  const handleNavigateToExercise = (exerciseId: string) => {
    if (onNavigateToExercise) {
      onNavigateToExercise(exerciseId);
    }
  };

  return (
    <div className="lesson-viewer">
      {/* Error Banner */}
      {loadError && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          padding: '15px',
          margin: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#c62828' }}>Error</strong>
            <p style={{ margin: '5px 0 0 0', color: '#333' }}>{loadError}</p>
          </div>
          <button
            onClick={() => setLoadError(null)}
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
      )}
      
      <div className="lesson-sidebar">
        <h2>Lessons</h2>
        
        {/* Completion Progress Bar */}
        {lessons.length > 0 && (() => {
          const stats = getCompletionStats();
          const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          return (
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
                textAlign: 'center'
              }}>
                {percentage}% Complete
              </div>
            </div>
          );
        })()}
        
        {/* Difficulty level filter */}
        <div className="difficulty-filter">
          <button
            className={selectedLevel === 'beginner' ? 'active' : ''}
            onClick={() => setSelectedLevel('beginner')}
          >
            Beginner
          </button>
          <button
            className={selectedLevel === 'intermediate' ? 'active' : ''}
            onClick={() => setSelectedLevel('intermediate')}
          >
            Intermediate
          </button>
          <button
            className={selectedLevel === 'advanced' ? 'active' : ''}
            onClick={() => setSelectedLevel('advanced')}
          >
            Advanced
          </button>
        </div>

        {/* Lesson list */}
        <div className="lesson-list">
          {lessons.length === 0 ? (
            <p className="no-lessons">No lessons available for this level</p>
          ) : (
            lessons.map((lesson: Lesson) => {
              const completed = isLessonCompleted(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className={`lesson-item ${selectedLesson?.id === lesson.id ? 'selected' : ''} ${completed ? 'completed' : ''}`}
                  onClick={() => handleLessonSelect(lesson)}
                  style={{
                    position: 'relative',
                    borderLeft: completed ? '4px solid #4CAF50' : '4px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <StatusIndicator 
                      status={completed ? 'completed' : 'in-progress'} 
                      size="small"
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>
                        {lesson.title}
                        {completed && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '12px',
                            color: '#4CAF50',
                            fontWeight: '600',
                            backgroundColor: '#E8F5E9',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            ✓ Done
                          </span>
                        )}
                      </h3>
                      <div className="lesson-concepts">
                        {lesson.concepts.slice(0, 3).map((concept: string, idx: number) => (
                          <span key={idx} className="concept-tag">{concept}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="lesson-content">
        {!selectedLesson ? (
          <div className="no-selection">
            <h2>Select a lesson to begin</h2>
            <p>Choose a lesson from the list to view its content</p>
          </div>
        ) : lessonContent ? (
          <div className="lesson-detail">
            <div className="lesson-header">
              <h1>{lessonContent.title}</h1>
              <span className={`level-badge ${lessonContent.level}`}>
                {lessonContent.level}
              </span>
            </div>

            {/* Concepts */}
            {lessonContent.concepts.length > 0 && (
              <div className="lesson-concepts-section">
                <h3>Key Concepts</h3>
                <div className="concepts-list">
                  {lessonContent.concepts.map((concept: string, idx: number) => (
                    <span key={idx} className="concept-badge">{concept}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Introduction */}
            <div className="lesson-introduction">
              <p>{lessonContent.content.introduction}</p>
            </div>

            {/* Sections with code examples */}
            {lessonContent.content.sections.map((section: ContentSection, idx: number) => (
              <div key={idx} className="lesson-section">
                <h2>{section.title}</h2>
                <div className="section-content">
                  {section.content.split('\n').map((paragraph: string, pIdx: number) => (
                    paragraph.trim() && <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>

                {/* Code examples with syntax highlighting */}
                {section.codeExamples && section.codeExamples.length > 0 && (
                  <div className="code-examples">
                    {section.codeExamples.map((example: CodeExample, exIdx: number) => (
                      <div key={exIdx} className="code-example">
                        <div className="code-header">
                          <span className="code-language">{example.language}</span>
                        </div>
                        <SyntaxHighlighter
                          language={example.language}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0 0 4px 4px',
                            fontSize: '14px'
                          }}
                        >
                          {example.code.trim()}
                        </SyntaxHighlighter>
                        {example.explanation && (
                          <p className="code-explanation">{example.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Diagrams */}
                {section.diagrams && section.diagrams.length > 0 && (
                  <div className="diagrams">
                    {section.diagrams.map((diagram: string, dIdx: number) => (
                      <div key={dIdx} className="diagram">
                        <pre>{diagram}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className="lesson-summary">
              <h2>Summary</h2>
              <p>{lessonContent.content.summary}</p>
            </div>

            {/* Resources Section - Show cheat sheet for kubectl lesson */}
            {selectedLesson.id === 'beginner-kubectl-basics' && (
              <div className="lesson-resources" style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '2px solid #e9ecef'
              }}>
                <h3 style={{ marginTop: 0, color: '#2196F3' }}>📚 Additional Resources</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '48px' }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>kubectl Command Cheat Sheet (PDF)</h4>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                      A comprehensive reference guide with all essential kubectl commands, organized by category. 
                      Perfect for quick lookups, printing, and learning! Available in both PDF and Markdown formats.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          const fs = (window as any).require('fs');
                          const path = (window as any).require('path');
                          const { shell } = (window as any).require('electron');
                          const pdfPath = path.join(process.cwd(), 'content/resources/kubectl-cheat-sheet.pdf');
                          
                          if (fs.existsSync(pdfPath)) {
                            shell.openPath(pdfPath);
                          } else {
                            alert('PDF cheat sheet not found. Please ensure the file exists at: ' + pdfPath);
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b71c1c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                      >
                        📕 Open PDF
                      </button>
                      <button
                        onClick={() => {
                          const fs = (window as any).require('fs');
                          const path = (window as any).require('path');
                          const { shell } = (window as any).require('electron');
                          const mdPath = path.join(process.cwd(), 'content/resources/kubectl-cheat-sheet.md');
                          
                          if (fs.existsSync(mdPath)) {
                            shell.openPath(mdPath);
                          } else {
                            alert('Markdown cheat sheet not found. Please ensure the file exists at: ' + mdPath);
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#757575',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#616161'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#757575'}
                      >
                        📝 Open Markdown
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Related exercises */}
            {lessonContent.exercises.length > 0 && (
              <div className="related-exercises">
                <h3>Practice Exercises</h3>
                <p style={{ marginBottom: '15px', color: '#666' }}>
                  Ready to practice what you've learned? Try these exercises:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lessonContent.exercises.map((exerciseId: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleNavigateToExercise(exerciseId)}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
                    >
                      <span>▶</span>
                      <span>Start Exercise: {exerciseId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete button */}
            <div className="lesson-actions">
              <button 
                className="btn-complete" 
                onClick={handleMarkComplete}
                disabled={isCompleted}
                style={{
                  backgroundColor: isCompleted ? '#4CAF50' : '#2196F3',
                  cursor: isCompleted ? 'default' : 'pointer',
                  opacity: isCompleted ? 0.8 : 1
                }}
              >
                {isCompleted ? '✓ Completed' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        ) : (
          <div className="loading">Loading lesson content...</div>
        )}
      </div>
    </div>
  );
};

export default LessonViewer;
