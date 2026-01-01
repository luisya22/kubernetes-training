import * as fc from 'fast-check';
import { ValidationEngine } from '../ValidationEngine';
import { DockerClient } from '../DockerClient';
import { KubernetesClient } from '../KubernetesClient';
import { ImageInfo } from '../../types';

// Mock the DockerClient and KubernetesClient
jest.mock('../DockerClient');
jest.mock('../KubernetesClient');

describe('Docker Image Validation - Property-Based Tests', () => {
  let validationEngine: ValidationEngine;
  let mockDockerClient: jest.Mocked<DockerClient>;
  let mockK8sClient: jest.Mocked<KubernetesClient>;

  beforeEach(() => {
    mockDockerClient = new DockerClient() as jest.Mocked<DockerClient>;
    mockK8sClient = new KubernetesClient() as jest.Mocked<KubernetesClient>;
    validationEngine = new ValidationEngine(mockK8sClient, mockDockerClient);
  });

  // **Feature: kubernetes-training-app, Property 20: Docker build validation**
  // **Validates: Requirements 11.2, 11.3, 11.4**
  describe('Property 20: Docker build validation', () => {
    test('for any Docker build exercise, after building an image, the test harness should verify the image exists in the local registry with expected tags', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            imageId: fc.hexaString({ minLength: 12, maxLength: 64 }),
            tags: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9.-]+$/.test(s)),
              { minLength: 1, maxLength: 5 }
            ),
            size: fc.integer({ min: 1000000, max: 1000000000 }),
            created: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          }),
          async ({ imageName, imageId, tags, size, created }) => {
            // Create full image tags (imageName:tag format)
            const fullTags = tags.map(tag => `${imageName}:${tag}`);
            
            // Create mock image info
            const mockImage: ImageInfo = {
              id: imageId,
              tags: fullTags,
              size: size,
              created: created
            };

            // Setup mock - image exists with expected tags
            mockDockerClient.getImage = jest.fn().mockResolvedValue(mockImage);

            // Validate with expected tags
            const result = await validationEngine.validateDockerImage(imageName, tags);

            // Property: If image exists with all expected tags, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should pass when image exists and no specific tags are expected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            imageId: fc.hexaString({ minLength: 12, maxLength: 64 }),
            tags: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9.-]+$/.test(s)),
              { minLength: 0, maxLength: 5 }
            ),
            size: fc.integer({ min: 1000000, max: 1000000000 }),
            created: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          }),
          async ({ imageName, imageId, tags, size, created }) => {
            // Create mock image info
            const mockImage: ImageInfo = {
              id: imageId,
              tags: tags,
              size: size,
              created: created
            };

            // Setup mock - image exists
            mockDockerClient.getImage = jest.fn().mockResolvedValue(mockImage);

            // Validate without expected tags (empty array)
            const result = await validationEngine.validateDockerImage(imageName, []);

            // Property: If image exists and no tags are required, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when image does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            expectedTags: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9.-]+$/.test(s)),
              { minLength: 0, maxLength: 5 }
            )
          }),
          async ({ imageName, expectedTags }) => {
            // Setup mock - image does not exist
            mockDockerClient.getImage = jest.fn().mockResolvedValue(null);

            // Validate
            const result = await validationEngine.validateDockerImage(imageName, expectedTags);

            // Property: If image doesn't exist, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when image exists but is missing expected tags', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            imageId: fc.hexaString({ minLength: 12, maxLength: 64 }),
            actualTags: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9.-]+$/.test(s)),
              { minLength: 1, maxLength: 3 }
            ),
            missingTag: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9.-]+$/.test(s)),
            size: fc.integer({ min: 1000000, max: 1000000000 }),
            created: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          }),
          async ({ imageName, imageId, actualTags, missingTag, size, created }) => {
            // Ensure missingTag is not in actualTags
            if (actualTags.includes(missingTag)) {
              return true; // Skip this case
            }

            // Create full image tags
            const fullTags = actualTags.map(tag => `${imageName}:${tag}`);
            
            // Create mock image info with only actualTags
            const mockImage: ImageInfo = {
              id: imageId,
              tags: fullTags,
              size: size,
              created: created
            };

            // Setup mock - image exists but missing a tag
            mockDockerClient.getImage = jest.fn().mockResolvedValue(mockImage);

            // Validate with expected tags including the missing one
            const expectedTags = [...actualTags, missingTag];
            const result = await validationEngine.validateDockerImage(imageName, expectedTags);

            // Property: If image is missing expected tags, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validateDockerBuildSuccess should pass when image exists after build', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            imageId: fc.hexaString({ minLength: 12, maxLength: 64 }),
            tags: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9.-]+$/.test(s)),
              { minLength: 1, maxLength: 5 }
            ),
            size: fc.integer({ min: 1000000, max: 1000000000 }),
            created: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          }),
          async ({ imageName, imageId, tags, size, created }) => {
            // Create mock image info
            const mockImage: ImageInfo = {
              id: imageId,
              tags: tags,
              size: size,
              created: created
            };

            // Setup mock - image exists (indicating successful build)
            mockDockerClient.getImage = jest.fn().mockResolvedValue(mockImage);

            // Validate build success
            const result = await validationEngine.validateDockerBuildSuccess(imageName);

            // Property: If image exists, build validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validateDockerBuildSuccess should fail when image does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          async (imageName) => {
            // Setup mock - image does not exist (build failed)
            mockDockerClient.getImage = jest.fn().mockResolvedValue(null);

            // Validate build success
            const result = await validationEngine.validateDockerBuildSuccess(imageName);

            // Property: If image doesn't exist, build validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
