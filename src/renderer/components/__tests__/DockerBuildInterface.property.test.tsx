/**
 * Property-Based Tests for Docker Build Interface
 * 
 * These tests verify universal properties that should hold across all Docker build operations
 */

import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DockerBuildInterface from '../DockerBuildInterface';
import { BuildResult } from '../../../types';

// Test configuration: run 100 iterations minimum
const testConfig = { numRuns: 100 };

// Arbitraries for generating test data
const buildOutputArbitrary = fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 });
const imageIdArbitrary = fc.hexaString({ minLength: 12, maxLength: 64 });
const tagArbitrary = fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9._-]/g, 'a') || 'test');
const contextPathArbitrary = fc.constantFrom('/test', '/app', '/build');
const dockerfileArbitrary = fc.constantFrom('Dockerfile', 'Dockerfile.prod', 'docker/Dockerfile');

// **Feature: kubernetes-training-app, Property 28: Docker build output streaming**
describe('Property 28: Docker build output streaming', () => {
  test('for any Docker build operation, the build command should be displayed with context, dockerfile, and tag', () => {
    fc.assert(
      fc.property(
        contextPathArbitrary,
        dockerfileArbitrary,
        tagArbitrary,
        (contextPath, dockerfile, tag) => {
          const { container } = render(
            <DockerBuildInterface
              contextPath={contextPath}
              dockerfile={dockerfile}
              tag={tag}
            />
          );

          const buildCommandElement = container.querySelector('.build-command');
          expect(buildCommandElement).toBeTruthy();
          
          const commandText = buildCommandElement?.textContent || '';
          
          // Verify all components are present in the command
          expect(commandText).toContain('docker build');
          expect(commandText).toContain(tag);
          expect(commandText).toContain(dockerfile);
          expect(commandText).toContain(contextPath);

          return true;
        }
      ),
      testConfig
    );
  });

  test('for any successful build, image ID should be displayed on completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildOutputArbitrary,
        imageIdArbitrary,
        tagArbitrary,
        async (output, imageId, tag) => {
          const mockDockerClient = {
            buildImage: jest.fn().mockResolvedValue({
              success: true,
              imageId,
              output
            }),
            getImage: jest.fn().mockResolvedValue({
              id: imageId,
              tags: [tag],
              size: 1024 * 1024,
              created: new Date()
            })
          };

          let capturedResult: BuildResult | null = null;
          const onBuildComplete = (result: BuildResult) => {
            capturedResult = result;
          };

          const { container } = render(
            <DockerBuildInterface
              contextPath="/test"
              dockerfile="Dockerfile"
              tag={tag}
              dockerClient={mockDockerClient}
              onBuildComplete={onBuildComplete}
            />
          );

          // Trigger build
          const buildButton = container.querySelector('button');
          expect(buildButton).toBeTruthy();
          if (buildButton) {
            await userEvent.click(buildButton);
          }

          // Wait for build to complete
          await waitFor(() => {
            expect(capturedResult).not.toBeNull();
          }, { timeout: 3000 });

          // Verify image ID is displayed
          await waitFor(() => {
            const resultElement = container.querySelector('.build-result');
            expect(resultElement).toBeTruthy();
            expect(resultElement?.textContent).toContain('Image ID');
            expect(resultElement?.textContent).toContain(imageId);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 15000); // Increase timeout for property tests

  test('for any build, output lines should be displayed in the build output area', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 3, maxLength: 10 }),
        tagArbitrary,
        async (outputLines, tag) => {
          const mockDockerClient = {
            buildImage: jest.fn().mockResolvedValue({
              success: true,
              imageId: 'test-id',
              output: outputLines
            }),
            getImage: jest.fn().mockResolvedValue({
              id: 'test-id',
              tags: [tag],
              size: 1024,
              created: new Date()
            })
          };

          const { container } = render(
            <DockerBuildInterface
              contextPath="/test"
              dockerfile="Dockerfile"
              tag={tag}
              dockerClient={mockDockerClient}
            />
          );

          const buildButton = container.querySelector('button');
          if (buildButton) {
            await userEvent.click(buildButton);
          }

          // Wait for output to appear
          await waitFor(() => {
            const buildOutputElement = container.querySelector('.build-output');
            expect(buildOutputElement).toBeTruthy();
          }, { timeout: 3000 });

          // Verify output lines are displayed
          const buildOutputElement = container.querySelector('.build-output');
          outputLines.forEach(line => {
            if (line.trim()) {
              expect(buildOutputElement?.textContent).toContain(line.trim());
            }
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 15000); // Increase timeout for property tests
});

// **Feature: kubernetes-training-app, Property 29: Docker build error highlighting**
describe('Property 29: Docker build error highlighting', () => {
  test('for any failed Docker build, error lines should be highlighted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            line: fc.string({ minLength: 5, maxLength: 50 }),
            isError: fc.boolean()
          }),
          { minLength: 3, maxLength: 15 }
        ),
        tagArbitrary,
        async (outputData, tag) => {
          // Create output with some error lines
          const output = outputData.map(item => {
            if (item.isError) {
              const errorPrefixes = ['ERROR:', 'error:', 'FAILED:', 'failed'];
              const prefix = errorPrefixes[Math.floor(Math.random() * errorPrefixes.length)];
              return `${prefix} ${item.line}`;
            }
            return item.line;
          });

          const mockDockerClient = {
            buildImage: jest.fn().mockResolvedValue({
              success: false,
              imageId: '',
              output
            }),
            getImage: jest.fn().mockResolvedValue(null)
          };

          const { container } = render(
            <DockerBuildInterface
              contextPath="/test"
              dockerfile="Dockerfile"
              tag={tag}
              dockerClient={mockDockerClient}
            />
          );

          const buildButton = container.querySelector('button');
          if (buildButton) {
            await userEvent.click(buildButton);
          }

          // Wait for build to complete
          await waitFor(() => {
            const resultElement = container.querySelector('.build-result');
            expect(resultElement).toBeTruthy();
          }, { timeout: 3000 });

          // Verify error lines have error class
          const errorLines = container.querySelectorAll('.build-output .error-line');
          const expectedErrorCount = outputData.filter(item => item.isError).length;
          
          // At least some error lines should be highlighted
          if (expectedErrorCount > 0) {
            expect(errorLines.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 15000); // Increase timeout for property tests

  test('error detection works for various error patterns', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'ERROR: Something went wrong',
          'error: build failed',
          'FAILED: compilation error',
          'failed to build',
          'Error during build'
        ),
        tagArbitrary,
        async (errorLine, tag) => {
          const output = ['Step 1/5', errorLine, 'Exiting'];

          const mockDockerClient = {
            buildImage: jest.fn().mockResolvedValue({
              success: false,
              imageId: '',
              output
            }),
            getImage: jest.fn().mockResolvedValue(null)
          };

          const { container } = render(
            <DockerBuildInterface
              contextPath="/test"
              dockerfile="Dockerfile"
              tag={tag}
              dockerClient={mockDockerClient}
            />
          );

          const buildButton = container.querySelector('button');
          if (buildButton) {
            await userEvent.click(buildButton);
          }

          await waitFor(() => {
            const resultElement = container.querySelector('.build-result');
            expect(resultElement).toBeTruthy();
          }, { timeout: 3000 });

          // Verify at least one error line is highlighted
          const errorLines = container.querySelectorAll('.build-output .error-line');
          expect(errorLines.length).toBeGreaterThan(0);

          return true;
        }
      ),
      testConfig
    );
  });

  test('non-error lines are not highlighted as errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 5, maxLength: 50 })
            .filter(s => !s.toLowerCase().includes('error') && 
                        !s.toLowerCase().includes('failed')),
          { minLength: 3, maxLength: 10 }
        ),
        tagArbitrary,
        async (normalLines, tag) => {
          if (normalLines.length === 0) return true;

          const mockDockerClient = {
            buildImage: jest.fn().mockResolvedValue({
              success: true,
              imageId: 'test-id',
              output: normalLines
            }),
            getImage: jest.fn().mockResolvedValue({
              id: 'test-id',
              tags: [tag],
              size: 1024,
              created: new Date()
            })
          };

          const { container } = render(
            <DockerBuildInterface
              contextPath="/test"
              dockerfile="Dockerfile"
              tag={tag}
              dockerClient={mockDockerClient}
            />
          );

          const buildButton = container.querySelector('button');
          if (buildButton) {
            await userEvent.click(buildButton);
          }

          await waitFor(() => {
            const resultElement = container.querySelector('.build-result');
            expect(resultElement).toBeTruthy();
          }, { timeout: 3000 });

          // Verify no lines are marked as errors
          const errorLines = container.querySelectorAll('.build-output .error-line');
          expect(errorLines.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
