/**
 * Tests for error handling and recovery functionality
 * Validates: Requirements 3.3, 8.1, 8.2, 8.3
 */

import { ValidationEngine, ClusterUnavailableError, DockerUnavailableError } from '../ValidationEngine';
import { retry, retryableErrors } from '../RetryUtil';
import { SystemHealthCheck } from '../SystemHealthCheck';

describe('Error Handling and Recovery', () => {
  describe('Custom Error Types', () => {
    it('should create ClusterUnavailableError with correct properties', () => {
      const error = new ClusterUnavailableError('Test message');
      expect(error.name).toBe('ClusterUnavailableError');
      expect(error.message).toBe('Test message');
      expect(error instanceof Error).toBe(true);
    });

    it('should create DockerUnavailableError with correct properties', () => {
      const error = new DockerUnavailableError('Test message');
      expect(error.name).toBe('DockerUnavailableError');
      expect(error.message).toBe('Test message');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Retry Utility', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return 'success';
      };

      const result = await retry(operation, { maxRetries: 3 });
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retry(operation, { maxRetries: 3 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw error after max retries exhausted', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Persistent failure');
      };

      await expect(retry(operation, { maxRetries: 2 })).rejects.toThrow('Persistent failure');
      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Non-retryable error');
      };

      await expect(
        retry(operation, {
          maxRetries: 3,
          retryableErrors: () => false
        })
      ).rejects.toThrow('Non-retryable error');
      
      expect(attempts).toBe(1); // Should not retry
    });

    it('should apply exponential backoff', async () => {
      const timestamps: number[] = [];
      let attempts = 0;
      
      const operation = async () => {
        timestamps.push(Date.now());
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry me');
        }
        return 'success';
      };

      await retry(operation, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2
      });

      expect(attempts).toBe(3);
      expect(timestamps.length).toBe(3);
      
      // Check that delays are increasing (with some tolerance for timing)
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];
        expect(delay2).toBeGreaterThan(delay1 * 0.8); // Allow 20% tolerance
      }
    });
  });

  describe('Retryable Error Detection', () => {
    it('should detect network errors', () => {
      const networkErrors = [
        new Error('Network timeout'),
        new Error('ECONNREFUSED'),
        new Error('ENOTFOUND'),
        new Error('ECONNRESET')
      ];

      networkErrors.forEach(error => {
        expect(retryableErrors.isNetworkError(error)).toBe(true);
      });
    });

    it('should detect Kubernetes API errors', () => {
      const k8sErrors = [
        new Error('503 Service Unavailable'),
        new Error('502 Bad Gateway'),
        new Error('504 Gateway Timeout')
      ];

      k8sErrors.forEach(error => {
        expect(retryableErrors.isKubernetesAPIError(error)).toBe(true);
      });
    });

    it('should detect Docker errors', () => {
      const dockerErrors = [
        new Error('Docker connection failed'),
        new Error('Docker timeout'),
        new Error('Docker temporary error')
      ];

      dockerErrors.forEach(error => {
        expect(retryableErrors.isDockerError(error)).toBe(true);
      });
    });

    it('should not detect non-retryable errors', () => {
      const nonRetryableErrors = [
        new Error('Invalid configuration'),
        new Error('Permission denied'),
        new Error('Resource not found')
      ];

      nonRetryableErrors.forEach(error => {
        expect(retryableErrors.isNetworkError(error)).toBe(false);
        expect(retryableErrors.isKubernetesAPIError(error)).toBe(false);
        expect(retryableErrors.isDockerError(error)).toBe(false);
      });
    });
  });

  describe('SystemHealthCheck', () => {
    it('should cache health check results', async () => {
      const healthCheck = new SystemHealthCheck();
      
      // First check
      const health1 = await healthCheck.checkHealth();
      
      // Second check (should be cached)
      const health2 = await healthCheck.checkHealth();
      
      expect(health1).toBe(health2); // Same object reference
    });

    it('should force refresh when requested', async () => {
      const healthCheck = new SystemHealthCheck();
      
      // First check
      const health1 = await healthCheck.checkHealth();
      
      // Force refresh
      const health2 = await healthCheck.checkHealth(true);
      
      // Results should be different objects (new check performed)
      expect(health1).not.toBe(health2);
    });

    it('should clear cache', async () => {
      const healthCheck = new SystemHealthCheck();
      
      await healthCheck.checkHealth();
      expect(healthCheck.getLastCheck()).not.toBeNull();
      
      healthCheck.clearCache();
      expect(healthCheck.getLastCheck()).toBeNull();
    });

    it('should provide health suggestions for unavailable systems', async () => {
      const healthCheck = new SystemHealthCheck();
      
      const mockHealth = {
        kubernetes: { available: false },
        docker: { available: false },
        overall: false
      };
      
      const suggestions = healthCheck.getHealthSuggestions(mockHealth);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('Kubernetes'))).toBe(true);
      expect(suggestions.some(s => s.includes('Docker'))).toBe(true);
    });
  });

  describe('ValidationEngine Error Handling', () => {
    it('should handle cluster unavailable gracefully', async () => {
      // Create a mock Kubernetes client that always fails
      const mockK8sClient = {
        isClusterAvailable: jest.fn().mockResolvedValue(false),
        getResource: jest.fn(),
        listResources: jest.fn(),
        executeCommand: jest.fn(),
        getCurrentContext: jest.fn(),
        getContexts: jest.fn(),
        setCurrentContext: jest.fn()
      };

      const validationEngine = new ValidationEngine(mockK8sClient as any);
      
      const result = await validationEngine.validateStep('test-step', {
        type: 'kubernetes',
        checks: []
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('unavailable');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle Docker unavailable gracefully', async () => {
      // Create a mock Docker client that always fails
      const mockDockerClient = {
        buildImage: jest.fn(),
        getImage: jest.fn(),
        listImages: jest.fn().mockRejectedValue(new Error('Docker not running')),
        streamBuildOutput: jest.fn()
      };

      const validationEngine = new ValidationEngine(undefined, mockDockerClient as any);
      
      const result = await validationEngine.validateStep('test-step', {
        type: 'docker',
        checks: []
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('unavailable');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide recovery suggestions for different error types', async () => {
      const validationEngine = new ValidationEngine();
      
      // Test with a validation that will fail
      const result = await validationEngine.validateStep('test-step', {
        type: 'kubernetes',
        checks: [
          {
            command: 'kubectl get pods nonexistent-pod',
            expectedOutput: 'Running'
          }
        ]
      });

      expect(result.success).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue operation even when some checks fail', async () => {
      const validationEngine = new ValidationEngine();
      
      // Mix of passing and failing checks
      const result = await validationEngine.validateStep('test-step', {
        type: 'custom',
        checks: [
          {
            customValidator: async () => true // This will pass
          },
          {
            customValidator: async () => false // This will fail
          }
        ]
      });

      // Should complete validation even with failures
      expect(result).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('should reset availability cache', () => {
      const validationEngine = new ValidationEngine();
      
      // Should not throw
      expect(() => validationEngine.resetAvailabilityCache()).not.toThrow();
    });
  });
});
