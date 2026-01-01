import * as fc from 'fast-check';
import { ValidationEngine } from '../ValidationEngine';
import { KubernetesClient } from '../KubernetesClient';
import { ExpectedResponse } from '../../types';

// Mock the KubernetesClient
jest.mock('../KubernetesClient');

describe('Comprehensive Test Harness - Property-Based Tests', () => {
  let validationEngine: ValidationEngine;
  let mockK8sClient: jest.Mocked<KubernetesClient>;

  beforeEach(() => {
    mockK8sClient = new KubernetesClient() as jest.Mocked<KubernetesClient>;
    validationEngine = new ValidationEngine(mockK8sClient);
  });

  // **Feature: kubernetes-training-app, Property 25: Comprehensive deployment validation**
  // **Validates: Requirements 13.1, 13.2, 13.3**
  describe('Property 25: Comprehensive deployment validation', () => {
    test('for any deployment validation, the test harness should check resource creation, configuration correctness, pod health, service connectivity, and resource limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            replicas: fc.integer({ min: 1, max: 5 }),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)), // Ensure valid label values
              { minKeys: 1, maxKeys: 3 }
            ),
            hasResourceLimits: fc.boolean()
          }),
          async ({ deploymentName, namespace, replicas, labels, hasResourceLimits }) => {
            // Create mock deployment with valid configuration
            const mockDeployment = {
              metadata: {
                name: deploymentName,
                namespace: namespace
              },
              spec: {
                replicas: replicas,
                selector: {
                  matchLabels: labels
                },
                template: {
                  metadata: {
                    labels: labels
                  },
                  spec: {
                    containers: [{
                      name: 'main',
                      image: 'nginx:latest'
                    }]
                  }
                }
              }
            };

            // Create mock pods - all running
            const mockPods = Array.from({ length: replicas }, (_, i) => ({
              metadata: {
                name: `${deploymentName}-${i}`,
                namespace: namespace,
                labels: labels
              },
              spec: {
                containers: [{
                  name: 'main',
                  image: 'nginx:latest',
                  resources: hasResourceLimits ? {
                    requests: { cpu: '100m', memory: '128Mi' },
                    limits: { cpu: '500m', memory: '512Mi' }
                  } : {}
                }]
              },
              status: {
                phase: 'Running'
              }
            }));

            // Setup mocks
            mockK8sClient.getResource = jest.fn().mockImplementation((type, name, namespace) => {
              if (type === 'deployment') {
                return Promise.resolve(mockDeployment);
              } else if (type === 'pod') {
                // Return the matching pod
                const pod = mockPods.find(p => p.metadata.name === name);
                return Promise.resolve(pod || null);
              }
              return Promise.resolve(null);
            });
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate comprehensively
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: Comprehensive validation should check multiple aspects
            expect(result).toBeDefined();
            expect(result.details).toBeDefined();
            expect(result.details.length).toBeGreaterThan(0);
            
            // Should check resource creation
            expect(result.details.some(d => d.includes('Resource Creation'))).toBe(true);
            
            // Should check configuration
            expect(result.details.some(d => d.includes('Configuration'))).toBe(true);
            
            // Should check pod health
            expect(result.details.some(d => d.includes('Pod Health'))).toBe(true);
            
            // Should check resource limits
            expect(result.details.some(d => d.includes('Resource Limits'))).toBe(true);
            
            // Should include validation summary
            expect(result.details.some(d => d.includes('Validation Summary'))).toBe(true);
            
            // Success depends on whether resource limits are configured
            if (hasResourceLimits) {
              expect(result.success).toBe(true);
              expect(result.details.some(d => d.includes('Validated components'))).toBe(true);
            } else {
              // Without resource limits, validation should fail on that check
              expect(result.success).toBe(false);
              expect(result.details.some(d => d.includes('Resource Limits') && d.includes('❌'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('comprehensive validation should fail when deployment does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production')
          }),
          async ({ deploymentName, namespace }) => {
            // Setup mock to return null (deployment doesn't exist)
            mockK8sClient.getResource = jest.fn().mockResolvedValue(null);
            mockK8sClient.listResources = jest.fn().mockResolvedValue([]);

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: If deployment doesn't exist, comprehensive validation should fail
            expect(result.success).toBe(false);
            expect(result.message).toContain('failed');
            expect(result.details.some(d => d.includes('Resource Creation'))).toBe(true);
            expect(result.suggestions.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('comprehensive validation should fail when pods are not healthy', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            replicas: fc.integer({ min: 1, max: 5 }),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 }),
              { minKeys: 1, maxKeys: 3 }
            ),
            podPhase: fc.constantFrom('Pending', 'Failed', 'Unknown')
          }),
          async ({ deploymentName, namespace, replicas, labels, podPhase }) => {
            const mockDeployment = {
              metadata: { name: deploymentName, namespace: namespace },
              spec: {
                replicas: replicas,
                selector: { matchLabels: labels },
                template: {
                  metadata: { labels: labels },
                  spec: { containers: [{ name: 'main', image: 'nginx:latest' }] }
                }
              }
            };

            // Create mock pods - not running
            const mockPods = Array.from({ length: replicas }, (_, i) => ({
              metadata: {
                name: `${deploymentName}-${i}`,
                namespace: namespace,
                labels: labels
              },
              status: {
                phase: podPhase
              }
            }));

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockDeployment);
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: If pods are not healthy, comprehensive validation should fail
            expect(result.success).toBe(false);
            expect(result.details.some(d => d.includes('Pod Health') && d.includes('❌'))).toBe(true);
            expect(result.suggestions.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('comprehensive validation should fail when deployment has invalid configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production')
          }),
          async ({ deploymentName, namespace }) => {
            // Create mock deployment with invalid spec (missing selector)
            const mockDeployment = {
              metadata: {
                name: deploymentName,
                namespace: namespace
              },
              spec: {
                // Missing selector and template - invalid configuration
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockDeployment);
            mockK8sClient.listResources = jest.fn().mockResolvedValue([]);

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: If deployment configuration is invalid, comprehensive validation should fail
            expect(result.success).toBe(false);
            expect(result.details.some(d => d.includes('Configuration') && d.includes('❌'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 26: Validation failure reporting**
  // **Validates: Requirements 13.4**
  describe('Property 26: Validation failure reporting', () => {
    test('for any test harness execution with failures, the report should identify which specific checks failed and provide reasons', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            failureType: fc.constantFrom('missing-deployment', 'invalid-config', 'unhealthy-pods', 'no-resources')
          }),
          async ({ deploymentName, namespace, failureType }) => {
            // Setup different failure scenarios
            switch (failureType) {
              case 'missing-deployment':
                mockK8sClient.getResource = jest.fn().mockResolvedValue(null);
                mockK8sClient.listResources = jest.fn().mockResolvedValue([]);
                break;
              
              case 'invalid-config':
                mockK8sClient.getResource = jest.fn().mockResolvedValue({
                  metadata: { name: deploymentName, namespace: namespace },
                  spec: {} // Invalid - missing required fields
                });
                mockK8sClient.listResources = jest.fn().mockResolvedValue([]);
                break;
              
              case 'unhealthy-pods':
                mockK8sClient.getResource = jest.fn().mockResolvedValue({
                  metadata: { name: deploymentName, namespace: namespace },
                  spec: {
                    replicas: 1,
                    selector: { matchLabels: { app: 'test' } },
                    template: {
                      metadata: { labels: { app: 'test' } },
                      spec: { containers: [{ name: 'main', image: 'nginx' }] }
                    }
                  }
                });
                mockK8sClient.listResources = jest.fn().mockResolvedValue([{
                  metadata: { name: `${deploymentName}-pod`, namespace: namespace, labels: { app: 'test' } },
                  status: { phase: 'Failed' }
                }]);
                break;
              
              case 'no-resources':
                mockK8sClient.getResource = jest.fn().mockResolvedValue({
                  metadata: { name: deploymentName, namespace: namespace },
                  spec: {
                    replicas: 1,
                    selector: { matchLabels: { app: 'test' } },
                    template: {
                      metadata: { labels: { app: 'test' } },
                      spec: { containers: [{ name: 'main', image: 'nginx' }] }
                    }
                  }
                });
                mockK8sClient.listResources = jest.fn().mockResolvedValue([{
                  metadata: { name: `${deploymentName}-pod`, namespace: namespace, labels: { app: 'test' } },
                  spec: {
                    containers: [{ name: 'main', image: 'nginx', resources: {} }]
                  },
                  status: { phase: 'Running' }
                }]);
                break;
            }

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: Failure report should identify specific failed checks with reasons
            expect(result.success).toBe(false);
            expect(result.message).toContain('failed');
            
            // Should have detailed failure information
            expect(result.details.length).toBeGreaterThan(0);
            expect(result.details.some(d => d.includes('❌'))).toBe(true);
            
            // Should include validation summary with failure count
            expect(result.details.some(d => d.includes('Validation Summary'))).toBe(true);
            expect(result.details.some(d => d.includes('Failed:'))).toBe(true);
            
            // Should list failed checks
            expect(result.details.some(d => d.includes('Failed checks:'))).toBe(true);
            
            // Should provide suggestions
            expect(result.suggestions).toBeDefined();
            expect(result.suggestions.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('failure report should include both passed and failed checks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 }),
              { minKeys: 1, maxKeys: 3 }
            )
          }),
          async ({ deploymentName, namespace, labels }) => {
            // Setup: deployment exists and is configured correctly, but pods are unhealthy
            const mockDeployment = {
              metadata: { name: deploymentName, namespace: namespace },
              spec: {
                replicas: 1,
                selector: { matchLabels: labels },
                template: {
                  metadata: { labels: labels },
                  spec: { containers: [{ name: 'main', image: 'nginx' }] }
                }
              }
            };

            const mockPods = [{
              metadata: { name: `${deploymentName}-pod`, namespace: namespace, labels: labels },
              status: { phase: 'Pending' } // Unhealthy
            }];

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockDeployment);
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: Report should show both passed and failed checks
            expect(result.success).toBe(false);
            
            // Should have passed checks (resource creation, configuration)
            expect(result.details.some(d => d.includes('✓'))).toBe(true);
            expect(result.details.some(d => d.includes('Passed checks:'))).toBe(true);
            
            // Should have failed checks (pod health)
            expect(result.details.some(d => d.includes('❌'))).toBe(true);
            expect(result.details.some(d => d.includes('Failed checks:'))).toBe(true);
            
            // Summary should show counts
            expect(result.details.some(d => d.includes('Passed:'))).toBe(true);
            expect(result.details.some(d => d.includes('Failed:'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 27: Validation success summary**
  // **Validates: Requirements 13.5**
  describe('Property 27: Validation success summary', () => {
    test('for any test harness execution where all checks pass, a summary of all validated components should be provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            replicas: fc.integer({ min: 1, max: 5 }),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)), // Ensure valid label values
              { minKeys: 1, maxKeys: 3 }
            )
          }),
          async ({ deploymentName, namespace, replicas, labels }) => {
            // Setup: everything is healthy and configured correctly
            const mockDeployment = {
              metadata: { name: deploymentName, namespace: namespace },
              spec: {
                replicas: replicas,
                selector: { matchLabels: labels },
                template: {
                  metadata: { labels: labels },
                  spec: { containers: [{ name: 'main', image: 'nginx' }] }
                }
              }
            };

            const mockPods = Array.from({ length: replicas }, (_, i) => ({
              metadata: {
                name: `${deploymentName}-${i}`,
                namespace: namespace,
                labels: labels
              },
              spec: {
                containers: [{
                  name: 'main',
                  image: 'nginx',
                  resources: {
                    requests: { cpu: '100m', memory: '128Mi' },
                    limits: { cpu: '500m', memory: '512Mi' }
                  }
                }]
              },
              status: { phase: 'Running' }
            }));

            mockK8sClient.getResource = jest.fn().mockImplementation((type, name, namespace) => {
              if (type === 'deployment') {
                return Promise.resolve(mockDeployment);
              } else if (type === 'pod') {
                const pod = mockPods.find(p => p.metadata.name === name);
                return Promise.resolve(pod || null);
              }
              return Promise.resolve(null);
            });
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: Success summary should list all validated components
            expect(result.success).toBe(true);
            expect(result.message).toContain('passed');
            
            // Should include validation summary
            expect(result.details.some(d => d.includes('Validation Summary'))).toBe(true);
            
            // Should show total checks and all passed
            expect(result.details.some(d => d.includes('Total checks:'))).toBe(true);
            expect(result.details.some(d => d.includes('Passed:'))).toBe(true);
            expect(result.details.some(d => d.includes('Failed: 0'))).toBe(true);
            
            // Should list validated components
            expect(result.details.some(d => d.includes('Validated components:'))).toBe(true);
            
            // Should have checkmarks for all components
            const checkmarkCount = result.details.filter(d => d.includes('✓')).length;
            expect(checkmarkCount).toBeGreaterThan(0);
            
            // Should have no suggestions (since everything passed)
            expect(result.suggestions.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('success summary should include all check types that were performed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)), // Ensure valid label values
              { minKeys: 1, maxKeys: 3 }
            )
          }),
          async ({ deploymentName, namespace, labels }) => {
            const mockDeployment = {
              metadata: { name: deploymentName, namespace: namespace },
              spec: {
                replicas: 1,
                selector: { matchLabels: labels },
                template: {
                  metadata: { labels: labels },
                  spec: { containers: [{ name: 'main', image: 'nginx' }] }
                }
              }
            };

            const mockPods = [{
              metadata: { name: `${deploymentName}-pod`, namespace: namespace, labels: labels },
              spec: {
                containers: [{
                  name: 'main',
                  image: 'nginx',
                  resources: {
                    requests: { cpu: '100m', memory: '128Mi' },
                    limits: { cpu: '500m', memory: '512Mi' }
                  }
                }]
              },
              status: { phase: 'Running' }
            }];

            mockK8sClient.getResource = jest.fn().mockImplementation((type, name, namespace) => {
              if (type === 'deployment') {
                return Promise.resolve(mockDeployment);
              } else if (type === 'pod') {
                const pod = mockPods.find(p => p.metadata.name === name);
                return Promise.resolve(pod || null);
              }
              return Promise.resolve(null);
            });
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate
            const result = await validationEngine.validateDeploymentComprehensive(
              deploymentName,
              namespace
            );

            // Property: Summary should list specific check types
            expect(result.success).toBe(true);
            
            // Should mention specific validated components
            const validatedComponents = result.details.filter(d => d.includes('✓'));
            expect(validatedComponents.some(d => d.includes('Resource Creation'))).toBe(true);
            expect(validatedComponents.some(d => d.includes('Configuration'))).toBe(true);
            expect(validatedComponents.some(d => d.includes('Pod Health'))).toBe(true);
            expect(validatedComponents.some(d => d.includes('Resource Limits'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
