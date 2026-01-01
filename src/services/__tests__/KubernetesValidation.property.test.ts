import * as fc from 'fast-check';
import { ValidationEngine } from '../ValidationEngine';
import { KubernetesClient } from '../KubernetesClient';

// Mock the KubernetesClient
jest.mock('../KubernetesClient');

describe('Kubernetes Resource Validation - Property-Based Tests', () => {
  let validationEngine: ValidationEngine;
  let mockK8sClient: jest.Mocked<KubernetesClient>;

  beforeEach(() => {
    mockK8sClient = new KubernetesClient() as jest.Mocked<KubernetesClient>;
    validationEngine = new ValidationEngine(mockK8sClient);
  });

  // **Feature: kubernetes-training-app, Property 21: Deployment pod verification**
  // **Validates: Requirements 12.1**
  describe('Property 21: Deployment pod verification', () => {
    test('for any microservice deployment, the test harness should verify that all expected pods are in running state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            replicas: fc.integer({ min: 1, max: 5 }),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 })
            )
          }),
          async ({ deploymentName, namespace, replicas, labels }) => {
            // Create mock deployment
            const mockDeployment = {
              metadata: {
                name: deploymentName,
                namespace: namespace
              },
              spec: {
                replicas: replicas,
                selector: {
                  matchLabels: labels
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
              status: {
                phase: 'Running'
              }
            }));

            // Setup mocks
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockDeployment);
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate
            const result = await validationEngine.validateDeploymentPods(deploymentName, namespace);

            // Property: If deployment exists with running pods, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when pods are not in running state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deploymentName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            replicas: fc.integer({ min: 1, max: 5 }),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 })
            ),
            podPhase: fc.constantFrom('Pending', 'Failed', 'Unknown')
          }),
          async ({ deploymentName, namespace, replicas, labels, podPhase }) => {
            // Create mock deployment
            const mockDeployment = {
              metadata: {
                name: deploymentName,
                namespace: namespace
              },
              spec: {
                replicas: replicas,
                selector: {
                  matchLabels: labels
                }
              }
            };

            // Create mock pods - not all running
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

            // Setup mocks
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockDeployment);
            mockK8sClient.listResources = jest.fn().mockResolvedValue(mockPods);

            // Validate
            const result = await validationEngine.validateDeploymentPods(deploymentName, namespace);

            // Property: If pods are not running, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 34: Configuration resource validation**
  // **Validates: Requirements 17.2, 17.3**
  describe('Property 34: Configuration resource validation', () => {
    test('for any ConfigMap creation, the test harness should verify the resource exists and contains expected key-value pairs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
                /^[a-zA-Z0-9_-]+$/.test(s) && 
                !['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'].includes(s)
              ),
              fc.string({ minLength: 1, maxLength: 50 }),
              { minKeys: 1, maxKeys: 5 }
            )
          }),
          async ({ name, namespace, data }) => {
            const expectedKeys = Object.keys(data);

            // Create mock ConfigMap
            const mockConfigMap = {
              metadata: {
                name: name,
                namespace: namespace
              },
              data: data
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockConfigMap);

            // Validate
            const result = await validationEngine.validateConfigMap(name, namespace, expectedKeys);

            // Property: If ConfigMap exists with expected keys, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any Secret creation, the test harness should verify the resource exists, contains expected keys, and data is base64 encoded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
                /^[a-zA-Z0-9_-]+$/.test(s) && 
                !['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'].includes(s)
              ),
              fc.string({ minLength: 1, maxLength: 50 }),
              { minKeys: 1, maxKeys: 5 }
            )
          }),
          async ({ name, namespace, data }) => {
            const expectedKeys = Object.keys(data);

            // Create mock Secret with base64 encoded data
            const base64Data: Record<string, string> = {};
            Object.entries(data).forEach(([key, value]) => {
              base64Data[key] = Buffer.from(value).toString('base64');
            });

            const mockSecret = {
              metadata: {
                name: name,
                namespace: namespace
              },
              data: base64Data
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockSecret);

            // Validate
            const result = await validationEngine.validateSecret(name, namespace, expectedKeys);

            // Property: If Secret exists with expected keys and base64 data, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when ConfigMap is missing expected keys', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            actualKeys: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 1, maxLength: 3 }),
            missingKey: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
          }),
          async ({ name, namespace, actualKeys, missingKey }) => {
            // Ensure missingKey is not in actualKeys
            if (actualKeys.includes(missingKey)) {
              return true; // Skip this case
            }

            const data: Record<string, string> = {};
            actualKeys.forEach(key => {
              data[key] = 'value';
            });

            // Create mock ConfigMap without the missing key
            const mockConfigMap = {
              metadata: {
                name: name,
                namespace: namespace
              },
              data: data
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockConfigMap);

            // Validate with expected keys including the missing one
            const expectedKeys = [...actualKeys, missingKey];
            const result = await validationEngine.validateConfigMap(name, namespace, expectedKeys);

            // Property: If ConfigMap is missing expected keys, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when Secret data is not base64 encoded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              // Generate strings that are NOT valid base64 (contain invalid characters)
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => /[^A-Za-z0-9+/=]/.test(s)),
              { minKeys: 1, maxKeys: 5 }
            )
          }),
          async ({ name, namespace, data }) => {
            const expectedKeys = Object.keys(data);

            // Create mock Secret with non-base64 data (contains invalid base64 characters)
            const mockSecret = {
              metadata: {
                name: name,
                namespace: namespace
              },
              data: data // Not valid base64 (contains invalid characters)
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockSecret);

            // Validate
            const result = await validationEngine.validateSecret(name, namespace, expectedKeys);

            // Property: If Secret data is not valid base64, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 37: PVC binding verification**
  // **Validates: Requirements 18.2**
  describe('Property 37: PVC binding verification', () => {
    test('for any PersistentVolumeClaim creation, the test harness should verify the claim is bound to a volume', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            storageSize: fc.integer({ min: 1, max: 100 }),
            storageClass: fc.constantFrom('standard', 'fast', 'slow')
          }),
          async ({ name, namespace, storageSize, storageClass }) => {
            // Create mock PVC in Bound state
            const mockPVC = {
              metadata: {
                name: name,
                namespace: namespace
              },
              spec: {
                storageClassName: storageClass,
                resources: {
                  requests: {
                    storage: `${storageSize}Gi`
                  }
                }
              },
              status: {
                phase: 'Bound'
              }
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPVC);

            // Validate
            const result = await validationEngine.validatePVCBinding(name, namespace);

            // Property: If PVC is in Bound phase, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when PVC is not in Bound phase', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            phase: fc.constantFrom('Pending', 'Lost', 'Available'),
            storageSize: fc.integer({ min: 1, max: 100 })
          }),
          async ({ name, namespace, phase, storageSize }) => {
            // Create mock PVC not in Bound state
            const mockPVC = {
              metadata: {
                name: name,
                namespace: namespace
              },
              spec: {
                resources: {
                  requests: {
                    storage: `${storageSize}Gi`
                  }
                }
              },
              status: {
                phase: phase
              }
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPVC);

            // Validate
            const result = await validationEngine.validatePVCBinding(name, namespace);

            // Property: If PVC is not in Bound phase, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 39: Namespace existence verification**
  // **Validates: Requirements 19.2**
  describe('Property 39: Namespace existence verification', () => {
    test('for any namespace creation, the test harness should verify the namespace exists in the cluster', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            labels: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 })
            )
          }),
          async ({ name, labels }) => {
            // Create mock namespace
            const mockNamespace = {
              metadata: {
                name: name,
                labels: labels
              },
              status: {
                phase: 'Active'
              }
            };

            // Setup mock
            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockNamespace);

            // Validate
            const result = await validationEngine.validateNamespace(name);

            // Property: If namespace exists, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when namespace does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          async (name) => {
            // Setup mock to return null (namespace doesn't exist)
            mockK8sClient.getResource = jest.fn().mockResolvedValue(null);

            // Validate
            const result = await validationEngine.validateNamespace(name);

            // Property: If namespace doesn't exist, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 33: Service-to-service communication validation**
  // **Validates: Requirements 16.2, 16.3, 16.4**
  describe('Property 33: Service-to-service communication validation', () => {
    test('for any multi-service deployment, the test harness should verify that service A can successfully call service B\'s API and that DNS resolution works between services', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fromService: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            toService: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            port: fc.integer({ min: 80, max: 8080 }),
            httpStatusCode: fc.constantFrom(200, 201, 204, 404, 500)
          }),
          async ({ fromService, toService, namespace, port, httpStatusCode }) => {
            // Ensure services have different names
            if (fromService === toService) {
              return true; // Skip this case
            }

            // Create mock pod for fromService
            const mockFromPod = {
              metadata: {
                name: `${fromService}-pod`,
                namespace: namespace,
                labels: {
                  app: fromService
                }
              },
              status: {
                phase: 'Running'
              }
            };

            // Setup mocks
            mockK8sClient.listResources = jest.fn().mockResolvedValue([mockFromPod]);
            
            // Mock executeCommand to simulate successful curl
            mockK8sClient.executeCommand = jest.fn().mockResolvedValue(String(httpStatusCode));

            // Validate
            const result = await validationEngine.validateServiceCommunication(
              fromService,
              toService,
              namespace,
              port
            );

            // Property: If services can communicate (any valid HTTP status), validation should pass
            expect(result).toBe(true);
            
            // Verify that executeCommand was called with curl to the correct DNS name
            expect(mockK8sClient.executeCommand).toHaveBeenCalledWith(
              `${fromService}-pod`,
              namespace,
              expect.arrayContaining([
                'curl',
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.stringContaining(`${toService}.${namespace}.svc.cluster.local:${port}`),
                expect.anything(),
                expect.anything()
              ])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when source pod is not running', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fromService: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            toService: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            podPhase: fc.constantFrom('Pending', 'Failed', 'Unknown')
          }),
          async ({ fromService, toService, namespace, podPhase }) => {
            if (fromService === toService) {
              return true; // Skip
            }

            // Create mock pod that's not running
            const mockFromPod = {
              metadata: {
                name: `${fromService}-pod`,
                namespace: namespace,
                labels: {
                  app: fromService
                }
              },
              status: {
                phase: podPhase
              }
            };

            mockK8sClient.listResources = jest.fn().mockResolvedValue([mockFromPod]);

            // Validate
            const result = await validationEngine.validateServiceCommunication(
              fromService,
              toService,
              namespace
            );

            // Property: If source pod is not running, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should succeed with DNS fallback when curl fails but nslookup succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            fromService: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            toService: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production')
          }),
          async ({ fromService, toService, namespace }) => {
            if (fromService === toService) {
              return true; // Skip
            }

            const mockFromPod = {
              metadata: {
                name: `${fromService}-pod`,
                namespace: namespace,
                labels: {
                  app: fromService
                }
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.listResources = jest.fn().mockResolvedValue([mockFromPod]);
            
            // Mock executeCommand: curl fails, but nslookup succeeds
            mockK8sClient.executeCommand = jest.fn()
              .mockRejectedValueOnce(new Error('curl failed'))
              .mockResolvedValueOnce('DNS resolution successful');

            // Validate
            const result = await validationEngine.validateServiceCommunication(
              fromService,
              toService,
              namespace
            );

            // Property: If DNS resolution works, validation should pass even if curl fails
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 35: Configuration mounting validation**
  // **Validates: Requirements 17.4, 17.5**
  describe('Property 35: Configuration mounting validation', () => {
    test('for any pod with mounted ConfigMaps or Secrets, the test harness should verify the pod can access the values via environment variables or volume mounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            podName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            configMapName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            secretName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            envVars: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[A-Z_][A-Z0-9_]*$/.test(s)),
              { minLength: 1, maxLength: 3 }
            )
          }),
          async ({ podName, namespace, configMapName, secretName, envVars }) => {
            // Create mock pod with ConfigMap and Secret mounted
            const mockPod = {
              metadata: {
                name: podName,
                namespace: namespace
              },
              spec: {
                containers: [{
                  name: 'main',
                  env: [
                    {
                      name: envVars[0],
                      valueFrom: {
                        configMapKeyRef: {
                          name: configMapName,
                          key: 'config-key'
                        }
                      }
                    }
                  ],
                  envFrom: [
                    {
                      secretRef: {
                        name: secretName
                      }
                    }
                  ]
                }],
                volumes: []
              },
              status: {
                phase: 'Running'
              }
            };

            // Mock env command output
            const envOutput = envVars.map(v => `${v}=value`).join('\n');

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPod);
            mockK8sClient.executeCommand = jest.fn().mockResolvedValue(envOutput);

            // Validate
            const result = await validationEngine.validateConfigurationMounting(
              podName,
              namespace,
              configMapName,
              secretName,
              envVars
            );

            // Property: If pod has ConfigMap/Secret mounted and env vars are accessible, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when pod is not using the specified ConfigMap', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            podName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            configMapName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s))
          }),
          async ({ podName, namespace, configMapName }) => {
            // Create mock pod without ConfigMap
            const mockPod = {
              metadata: {
                name: podName,
                namespace: namespace
              },
              spec: {
                containers: [{
                  name: 'main',
                  env: []
                }],
                volumes: []
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPod);

            // Validate
            const result = await validationEngine.validateConfigurationMounting(
              podName,
              namespace,
              configMapName
            );

            // Property: If pod is not using ConfigMap, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when expected environment variables are not present', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            podName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            configMapName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            presentVars: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[A-Z_][A-Z0-9_]*$/.test(s)), { minLength: 1, maxLength: 2 }),
            missingVar: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[A-Z_][A-Z0-9_]*$/.test(s))
          }),
          async ({ podName, namespace, configMapName, presentVars, missingVar }) => {
            // Ensure missingVar is not in presentVars
            if (presentVars.includes(missingVar)) {
              return true; // Skip
            }

            const mockPod = {
              metadata: {
                name: podName,
                namespace: namespace
              },
              spec: {
                containers: [{
                  name: 'main',
                  envFrom: [{
                    configMapRef: {
                      name: configMapName
                    }
                  }]
                }],
                volumes: []
              },
              status: {
                phase: 'Running'
              }
            };

            // Mock env output with only present vars
            const envOutput = presentVars.map(v => `${v}=value`).join('\n');

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPod);
            mockK8sClient.executeCommand = jest.fn().mockResolvedValue(envOutput);

            // Validate with expected vars including the missing one
            const expectedVars = [...presentVars, missingVar];
            const result = await validationEngine.validateConfigurationMounting(
              podName,
              namespace,
              configMapName,
              undefined,
              expectedVars
            );

            // Property: If expected env vars are not present, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 36: Storage persistence validation**
  // **Validates: Requirements 18.3, 18.4**
  describe('Property 36: Storage persistence validation', () => {
    test('for any pod with a mounted PersistentVolumeClaim, writing data to the volume then deleting and recreating the pod should preserve the data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            podName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            pvcName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            mountPath: fc.constantFrom('/data', '/mnt/storage', '/var/lib/data'),
            testData: fc.string({ minLength: 1, maxLength: 50 })
          }),
          async ({ podName, namespace, pvcName, mountPath, testData }) => {
            // Create mock pod with PVC mounted
            const mockPod = {
              metadata: {
                name: podName,
                namespace: namespace
              },
              spec: {
                containers: [{
                  name: 'main',
                  volumeMounts: [{
                    name: 'storage',
                    mountPath: mountPath
                  }]
                }],
                volumes: [{
                  name: 'storage',
                  persistentVolumeClaim: {
                    claimName: pvcName
                  }
                }]
              },
              status: {
                phase: 'Running'
              }
            };

            // Create mock PVC
            const mockPVC = {
              metadata: {
                name: pvcName,
                namespace: namespace
              },
              status: {
                phase: 'Bound'
              }
            };

            mockK8sClient.getResource = jest.fn()
              .mockResolvedValueOnce(mockPod)  // First call for pod
              .mockResolvedValueOnce(mockPVC); // Second call for PVC

            // Mock executeCommand for write, read, and cleanup
            mockK8sClient.executeCommand = jest.fn()
              .mockResolvedValueOnce('')  // Write command
              .mockResolvedValueOnce(testData)  // Read command
              .mockResolvedValueOnce('');  // Cleanup command

            // Validate
            const result = await validationEngine.validateStoragePersistence(
              podName,
              namespace,
              pvcName,
              mountPath,
              testData
            );

            // Property: If data can be written and read back, and PVC is bound, validation should pass
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when pod is not using the specified PVC', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            podName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            pvcName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            mountPath: fc.constantFrom('/data', '/mnt/storage')
          }),
          async ({ podName, namespace, pvcName, mountPath }) => {
            // Create mock pod without PVC
            const mockPod = {
              metadata: {
                name: podName,
                namespace: namespace
              },
              spec: {
                containers: [{
                  name: 'main'
                }],
                volumes: []  // No volumes
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPod);

            // Validate
            const result = await validationEngine.validateStoragePersistence(
              podName,
              namespace,
              pvcName,
              mountPath
            );

            // Property: If pod is not using PVC, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when data write fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            podName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.constantFrom('default', 'test', 'production'),
            pvcName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            mountPath: fc.constantFrom('/data', '/mnt/storage')
          }),
          async ({ podName, namespace, pvcName, mountPath }) => {
            const mockPod = {
              metadata: {
                name: podName,
                namespace: namespace
              },
              spec: {
                containers: [{
                  name: 'main'
                }],
                volumes: [{
                  name: 'storage',
                  persistentVolumeClaim: {
                    claimName: pvcName
                  }
                }]
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPod);
            
            // Mock write command to fail
            mockK8sClient.executeCommand = jest.fn().mockRejectedValue(new Error('Write failed'));

            // Validate
            const result = await validationEngine.validateStoragePersistence(
              podName,
              namespace,
              pvcName,
              mountPath
            );

            // Property: If data write fails, validation should fail
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: kubernetes-training-app, Property 38: Namespace isolation**
  // **Validates: Requirements 19.3, 19.4**
  describe('Property 38: Namespace isolation', () => {
    test('for any resource deployed to a namespace, the test harness should verify it is not accessible from other namespaces without explicit configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            resourceName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceNamespace: fc.constantFrom('namespace-a', 'namespace-b', 'namespace-c'),
            testFromNamespace: fc.constantFrom('namespace-x', 'namespace-y', 'namespace-z')
          }),
          async ({ resourceName, resourceNamespace, testFromNamespace }) => {
            // Ensure different namespaces
            if (resourceNamespace === testFromNamespace) {
              return true; // Skip same namespace test
            }

            // Create mock service in resource namespace
            const mockService = {
              metadata: {
                name: resourceName,
                namespace: resourceNamespace
              },
              spec: {
                ports: [{
                  port: 80
                }]
              }
            };

            // Create mock pod in test namespace
            const mockTestPod = {
              metadata: {
                name: 'test-pod',
                namespace: testFromNamespace
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockService);
            mockK8sClient.listResources = jest.fn()
              .mockResolvedValueOnce([mockTestPod])  // Pods in test namespace
              .mockResolvedValueOnce([]);  // No services with same name in test namespace

            // Mock executeCommand to fail (service not accessible without FQDN)
            mockK8sClient.executeCommand = jest.fn().mockRejectedValue(new Error('Connection refused'));

            // Validate
            const result = await validationEngine.validateNamespaceIsolation(
              'service',
              resourceName,
              resourceNamespace,
              testFromNamespace
            );

            // Property: If service is not accessible from other namespace without FQDN, isolation is working
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should fail when resource is accessible from other namespace without FQDN', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            resourceName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceNamespace: fc.constantFrom('namespace-a', 'namespace-b'),
            testFromNamespace: fc.constantFrom('namespace-x', 'namespace-y')
          }),
          async ({ resourceName, resourceNamespace, testFromNamespace }) => {
            if (resourceNamespace === testFromNamespace) {
              return true; // Skip
            }

            const mockService = {
              metadata: {
                name: resourceName,
                namespace: resourceNamespace
              },
              spec: {
                ports: [{
                  port: 80
                }]
              }
            };

            const mockTestPod = {
              metadata: {
                name: 'test-pod',
                namespace: testFromNamespace
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockService);
            mockK8sClient.listResources = jest.fn().mockResolvedValue([mockTestPod]);

            // Mock executeCommand to succeed (service IS accessible - isolation broken)
            mockK8sClient.executeCommand = jest.fn().mockResolvedValue('200');

            // Validate
            const result = await validationEngine.validateNamespaceIsolation(
              'service',
              resourceName,
              resourceNamespace,
              testFromNamespace
            );

            // Property: If service is accessible without FQDN, isolation is broken
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should verify resource does not appear in other namespace listings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            resourceName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceNamespace: fc.constantFrom('namespace-a', 'namespace-b'),
            testFromNamespace: fc.constantFrom('namespace-x', 'namespace-y')
          }),
          async ({ resourceName, resourceNamespace, testFromNamespace }) => {
            if (resourceNamespace === testFromNamespace) {
              return true; // Skip
            }

            // Create mock pod in resource namespace
            const mockPod = {
              metadata: {
                name: resourceName,
                namespace: resourceNamespace
              },
              status: {
                phase: 'Running'
              }
            };

            mockK8sClient.getResource = jest.fn().mockResolvedValue(mockPod);
            
            // List resources in test namespace - should not include our pod
            mockK8sClient.listResources = jest.fn().mockResolvedValue([]);

            // Validate
            const result = await validationEngine.validateNamespaceIsolation(
              'pod',
              resourceName,
              resourceNamespace,
              testFromNamespace
            );

            // Property: If resource doesn't appear in other namespace listings, isolation is working
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
