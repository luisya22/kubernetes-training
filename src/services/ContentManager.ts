import * as fs from 'fs';
import * as path from 'path';
import { 
  Lesson, 
  Exercise, 
  Microservice, 
  DifficultyLevel,
  LessonContent,
  ExerciseDefinition,
  ExerciseStep,
  ValidationCriteria
} from '../types';

export class ContentManager {
  private lessonsCache: Map<string, Lesson> = new Map();
  private exercisesCache: Map<string, Exercise> = new Map();
  private microservicesCache: Map<string, Microservice> = new Map();
  private contentPath: string;

  constructor(contentPath?: string) {
    // Default to content directory in app root
    this.contentPath = contentPath || path.join(__dirname, '../../content');
    this.loadContent();
  }

  private loadContent(): void {
    this.loadLessons();
    this.loadExercises();
    this.loadMicroservices();
  }

  private loadLessons(): void {
    const lessonsDir = path.join(this.contentPath, 'lessons');
    
    if (!fs.existsSync(lessonsDir)) {
      return;
    }

    const files = fs.readdirSync(lessonsDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(lessonsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const lessonContent: LessonContent = JSON.parse(content);
          
          // Convert LessonContent to Lesson
          const lesson: Lesson = {
            id: lessonContent.id,
            title: lessonContent.title,
            level: lessonContent.level,
            order: lessonContent.order,
            content: this.formatLessonContent(lessonContent),
            concepts: lessonContent.concepts,
            exercises: lessonContent.exercises
          };
          
          this.lessonsCache.set(lesson.id, lesson);
        } catch (error) {
          console.error(`Error loading lesson from ${file}:`, error);
        }
      }
    }
  }

  private formatLessonContent(lessonContent: LessonContent): string {
    let formatted = lessonContent.content.introduction + '\n\n';
    
    for (const section of lessonContent.content.sections) {
      formatted += `## ${section.title}\n\n`;
      formatted += section.content + '\n\n';
      
      if (section.codeExamples) {
        for (const example of section.codeExamples) {
          formatted += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n`;
          formatted += example.explanation + '\n\n';
        }
      }
    }
    
    formatted += lessonContent.content.summary;
    
    return formatted;
  }

  private loadExercises(): void {
    const exercisesDir = path.join(this.contentPath, 'exercises');
    
    if (!fs.existsSync(exercisesDir)) {
      return;
    }

    const files = fs.readdirSync(exercisesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(exercisesDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const exerciseDef: ExerciseDefinition = JSON.parse(content);
          
          // Convert ExerciseDefinition to Exercise
          const exercise: Exercise = {
            id: exerciseDef.id,
            lessonId: exerciseDef.lessonId,
            title: exerciseDef.title,
            description: exerciseDef.description,
            steps: exerciseDef.steps.map(step => ({
              id: step.id,
              instruction: step.instruction,
              expectedOutcome: step.expectedOutcome,
              hints: step.hints
            })),
            validationCriteria: exerciseDef.steps.map(step => step.validation),
            resources: exerciseDef.resources || []
          };
          
          this.exercisesCache.set(exercise.id, exercise);
        } catch (error) {
          console.error(`Error loading exercise from ${file}:`, error);
        }
      }
    }
  }

  private loadMicroservices(): void {
    const microservicesDir = path.join(this.contentPath, 'microservices');
    
    if (!fs.existsSync(microservicesDir)) {
      return;
    }

    const dirs = fs.readdirSync(microservicesDir);
    
    for (const dir of dirs) {
      const microservicePath = path.join(microservicesDir, dir);
      const stat = fs.statSync(microservicePath);
      
      if (stat.isDirectory()) {
        try {
          const metadataPath = path.join(microservicePath, 'metadata.json');
          
          if (!fs.existsSync(metadataPath)) {
            continue;
          }
          
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          
          // Read source code
          const sourceCodePath = path.join(microservicePath, metadata.sourceFile || 'app.js');
          const sourceCode = fs.existsSync(sourceCodePath) 
            ? fs.readFileSync(sourceCodePath, 'utf-8') 
            : '';
          
          // Read Dockerfile
          const dockerfilePath = path.join(microservicePath, 'Dockerfile');
          const dockerfile = fs.existsSync(dockerfilePath)
            ? fs.readFileSync(dockerfilePath, 'utf-8')
            : '';
          
          // Read manifests
          const manifestsDir = path.join(microservicePath, 'manifests');
          const manifests: string[] = [];
          
          if (fs.existsSync(manifestsDir)) {
            const manifestFiles = fs.readdirSync(manifestsDir);
            for (const file of manifestFiles) {
              if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                const manifestPath = path.join(manifestsDir, file);
                manifests.push(fs.readFileSync(manifestPath, 'utf-8'));
              }
            }
          }
          
          const microservice: Microservice = {
            id: metadata.id || dir,
            name: metadata.name || dir,
            language: metadata.language || 'unknown',
            sourceCode,
            dockerfile,
            manifests
          };
          
          this.microservicesCache.set(microservice.id, microservice);
        } catch (error) {
          console.error(`Error loading microservice from ${dir}:`, error);
        }
      }
    }
  }

  getLessons(level: DifficultyLevel): Lesson[] {
    const lessons: Lesson[] = [];
    
    for (const lesson of this.lessonsCache.values()) {
      if (lesson.level === level) {
        lessons.push(lesson);
      }
    }
    
    // Sort lessons by order field
    return lessons.sort((a, b) => a.order - b.order);
  }

  getAllLessons(): Lesson[] {
    return Array.from(this.lessonsCache.values());
  }

  getLesson(id: string): Lesson | null {
    return this.lessonsCache.get(id) || null;
  }

  getExercise(id: string): Exercise | null {
    return this.exercisesCache.get(id) || null;
  }

  getExercisesByLesson(lessonId: string): Exercise[] {
    const exercises: Exercise[] = [];
    
    for (const exercise of this.exercisesCache.values()) {
      if (exercise.lessonId === lessonId) {
        exercises.push(exercise);
      }
    }
    
    return exercises;
  }

  getAllExercises(): Exercise[] {
    return Array.from(this.exercisesCache.values());
  }

  getSampleMicroservice(id: string): Microservice | null {
    return this.microservicesCache.get(id) || null;
  }

  getAllMicroservices(): Microservice[] {
    return Array.from(this.microservicesCache.values());
  }
}
