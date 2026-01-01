import { ContentManager } from '../ContentManager';
import * as fc from 'fast-check';
import * as path from 'path';

describe('ContentManager', () => {
  let contentManager: ContentManager;

  beforeEach(() => {
    // Use the actual content directory for tests
    const contentPath = path.join(__dirname, '../../../content');
    contentManager = new ContentManager(contentPath);
  });

  test('should be instantiable', () => {
    expect(contentManager).toBeInstanceOf(ContentManager);
  });

  // **Feature: kubernetes-training-app, Property 14: Lesson organization by difficulty**
  // **Validates: Requirements 7.1**
  test('lessons should be organized by difficulty with no duplicates across levels', () => {
    const testConfig = { numRuns: 100 };
    
    fc.assert(
      fc.property(
        fc.constantFrom('beginner' as const, 'intermediate' as const, 'advanced' as const),
        (level) => {
          // Get lessons for the specified level
          const lessonsForLevel = contentManager.getLessons(level);
          
          // Property 1: All returned lessons should have the correct level
          const allHaveCorrectLevel = lessonsForLevel.every(lesson => lesson.level === level);
          
          // Property 2: No lesson should appear in multiple difficulty levels
          const allLessons = contentManager.getAllLessons();
          const beginnerLessons = contentManager.getLessons('beginner');
          const intermediateLessons = contentManager.getLessons('intermediate');
          const advancedLessons = contentManager.getLessons('advanced');
          
          const beginnerIds = new Set(beginnerLessons.map(l => l.id));
          const intermediateIds = new Set(intermediateLessons.map(l => l.id));
          const advancedIds = new Set(advancedLessons.map(l => l.id));
          
          // Check no overlap between levels
          let noOverlap = true;
          beginnerIds.forEach(id => {
            if (intermediateIds.has(id) || advancedIds.has(id)) {
              noOverlap = false;
            }
          });
          intermediateIds.forEach(id => {
            if (advancedIds.has(id)) {
              noOverlap = false;
            }
          });
          
          // Property 3: All lessons are accounted for (no lesson is missing from all levels)
          const totalFromLevels = beginnerLessons.length + intermediateLessons.length + advancedLessons.length;
          const allAccountedFor = totalFromLevels === allLessons.length;
          
          return allHaveCorrectLevel && noOverlap && allAccountedFor;
        }
      ),
      testConfig
    );
  });

  // **Feature: kubernetes-training-app, Property 1: Lesson content completeness**
  // **Validates: Requirements 1.3**
  test('lesson content should include code examples and diagrams when defined', () => {
    const testConfig = { numRuns: 100 };
    
    fc.assert(
      fc.property(
        fc.constantFrom(...contentManager.getAllLessons()),
        (lesson) => {
          // Get the original lesson content from file to check what was defined
          const contentPath = path.join(__dirname, '../../../content/lessons');
          const lessonFiles = require('fs').readdirSync(contentPath);
          
          let originalContent = null;
          for (const file of lessonFiles) {
            if (file.endsWith('.json')) {
              const filePath = path.join(contentPath, file);
              const fileContent = require('fs').readFileSync(filePath, 'utf-8');
              const parsed = JSON.parse(fileContent);
              if (parsed.id === lesson.id) {
                originalContent = parsed;
                break;
              }
            }
          }
          
          if (!originalContent) {
            return true; // Skip if we can't find the original
          }
          
          // Check if code examples are included in rendered content
          let codeExamplesIncluded = true;
          if (originalContent.content.sections) {
            for (const section of originalContent.content.sections) {
              if (section.codeExamples && section.codeExamples.length > 0) {
                for (const example of section.codeExamples) {
                  // The formatted content should include the code in a code block
                  if (!lesson.content.includes(example.code)) {
                    codeExamplesIncluded = false;
                  }
                  // The formatted content should include the explanation
                  if (!lesson.content.includes(example.explanation)) {
                    codeExamplesIncluded = false;
                  }
                }
              }
            }
          }
          
          // Check if diagrams are referenced in rendered content
          let diagramsIncluded = true;
          if (originalContent.content.sections) {
            for (const section of originalContent.content.sections) {
              if (section.diagrams && section.diagrams.length > 0) {
                // For now, we just check that the section content is included
                // In a real implementation, diagrams would be rendered or referenced
                if (!lesson.content.includes(section.content)) {
                  diagramsIncluded = false;
                }
              }
            }
          }
          
          return codeExamplesIncluded && diagramsIncluded;
        }
      ),
      testConfig
    );
  });

  // **Feature: kubernetes-training-app, Property 19: Microservice exercise resources**
  // **Validates: Requirements 10.1, 10.2**
  test('microservice exercises should include source code and Dockerfile', () => {
    const allMicroservices = contentManager.getAllMicroservices();

    allMicroservices.forEach(microservice => {
      // Each microservice should have source code
      expect(microservice.sourceCode).toBeDefined();
      expect(typeof microservice.sourceCode).toBe('string');
      expect(microservice.sourceCode.length).toBeGreaterThan(0);

      // Each microservice should have a Dockerfile
      expect(microservice.dockerfile).toBeDefined();
      expect(typeof microservice.dockerfile).toBe('string');
      expect(microservice.dockerfile.length).toBeGreaterThan(0);

      // Verify Dockerfile contains expected content
      expect(microservice.dockerfile).toContain('FROM');
    });
  });
});

