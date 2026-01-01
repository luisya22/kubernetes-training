import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LessonViewer from '../LessonViewer';
import { ContentManager } from '../../../services/ContentManager';
import { Lesson, DifficultyLevel } from '../../../types';

// Mock ContentManager
jest.mock('../../../services/ContentManager');

describe('LessonViewer', () => {
  let mockContentManager: jest.Mocked<ContentManager>;
  let mockLessons: Lesson[];

  beforeEach(() => {
    mockLessons = [
      {
        id: 'beginner-pods',
        title: 'Introduction to Pods',
        level: 'beginner' as DifficultyLevel,
        content: 'Pods are the smallest deployable units in Kubernetes.\n\n## What is a Pod?\n\nA Pod encapsulates containers.\n\n```yaml\napiVersion: v1\nkind: Pod\n```\n\nSummary content here.',
        concepts: ['pods', 'containers', 'kubectl'],
        exercises: ['exercise-create-pod']
      },
      {
        id: 'intermediate-configmaps',
        title: 'ConfigMaps and Configuration',
        level: 'intermediate' as DifficultyLevel,
        content: 'ConfigMaps allow you to decouple configuration.',
        concepts: ['configmaps', 'configuration'],
        exercises: ['exercise-configmap']
      }
    ];

    mockContentManager = {
      getLessons: jest.fn((level: DifficultyLevel) => {
        return mockLessons.filter(l => l.level === level);
      }),
      getLesson: jest.fn(),
      getExercise: jest.fn(),
      getSampleMicroservice: jest.fn(),
      getAllLessons: jest.fn(),
      getExercisesByLesson: jest.fn(),
      getAllExercises: jest.fn(),
      getAllMicroservices: jest.fn()
    } as any;
  });

  it('should render lesson list with difficulty filtering', () => {
    render(<LessonViewer contentManager={mockContentManager} />);

    // Check that difficulty filter buttons are present
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();

    // Check that lessons are loaded for beginner level by default
    expect(mockContentManager.getLessons).toHaveBeenCalledWith('beginner');
  });

  it('should display lesson list for selected difficulty level', () => {
    render(<LessonViewer contentManager={mockContentManager} />);

    // Should show beginner lesson
    expect(screen.getByText('Introduction to Pods')).toBeInTheDocument();
  });

  it('should display lesson detail when a lesson is selected', () => {
    render(<LessonViewer contentManager={mockContentManager} />);

    // Click on a lesson
    const lessonItem = screen.getByText('Introduction to Pods');
    fireEvent.click(lessonItem);

    // Check that lesson content is displayed (using getAllByText since title appears twice)
    const titles = screen.getAllByText('Introduction to Pods');
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('should render code examples with syntax highlighting', () => {
    render(<LessonViewer contentManager={mockContentManager} />);

    // Click on a lesson
    const lessonItem = screen.getByText('Introduction to Pods');
    fireEvent.click(lessonItem);

    // Check that code example is rendered (syntax highlighter creates a pre element)
    const codeElements = screen.getAllByText(/apiVersion/);
    expect(codeElements.length).toBeGreaterThan(0);
  });

  it('should filter lessons when difficulty level is changed', () => {
    render(<LessonViewer contentManager={mockContentManager} />);

    // Click intermediate button
    const intermediateButton = screen.getByText('Intermediate');
    fireEvent.click(intermediateButton);

    // Check that getLessons was called with intermediate
    expect(mockContentManager.getLessons).toHaveBeenCalledWith('intermediate');
  });

  it('should call onLessonComplete when mark complete button is clicked', () => {
    const mockOnComplete = jest.fn();
    render(<LessonViewer contentManager={mockContentManager} onLessonComplete={mockOnComplete} />);

    // Select a lesson
    const lessonItem = screen.getByText('Introduction to Pods');
    fireEvent.click(lessonItem);

    // Click mark complete button
    const completeButton = screen.getByText('Mark as Complete');
    fireEvent.click(completeButton);

    // Check that callback was called
    expect(mockOnComplete).toHaveBeenCalledWith('beginner-pods');
    
    // Check that button text changes to "Completed"
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();
  });

  it('should call onNavigateToExercise when exercise button is clicked', () => {
    const mockOnNavigate = jest.fn();
    render(<LessonViewer contentManager={mockContentManager} onNavigateToExercise={mockOnNavigate} />);

    // Select a lesson
    const lessonItem = screen.getByText('Introduction to Pods');
    fireEvent.click(lessonItem);

    // Click exercise button
    const exerciseButton = screen.getByText(/Start Exercise: exercise-create-pod/);
    fireEvent.click(exerciseButton);

    // Check that callback was called
    expect(mockOnNavigate).toHaveBeenCalledWith('exercise-create-pod');
  });

  it('should display concepts for each lesson', () => {
    render(<LessonViewer contentManager={mockContentManager} />);

    // Check that concepts are displayed in the lesson list
    expect(screen.getByText('pods')).toBeInTheDocument();
    expect(screen.getByText('containers')).toBeInTheDocument();
  });

  it('should show no lessons message when no lessons are available', () => {
    mockContentManager.getLessons.mockReturnValue([]);
    render(<LessonViewer contentManager={mockContentManager} />);

    expect(screen.getByText('No lessons available for this level')).toBeInTheDocument();
  });
});
