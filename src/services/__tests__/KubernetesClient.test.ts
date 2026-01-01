import { KubernetesClient } from '../KubernetesClient';

describe('KubernetesClient', () => {
  let client: KubernetesClient;

  beforeEach(() => {
    client = new KubernetesClient();
  });

  describe('initialization', () => {
    test('should create a KubernetesClient instance', () => {
      expect(client).toBeInstanceOf(KubernetesClient);
    });

    test('should have getCurrentContext method', () => {
      expect(typeof client.getCurrentContext).toBe('function');
    });

    test('should have getContexts method', () => {
      expect(typeof client.getContexts).toBe('function');
    });

    test('should have setCurrentContext method', () => {
      expect(typeof client.setCurrentContext).toBe('function');
    });
  });

  describe('isClusterAvailable', () => {
    test('should return a boolean', async () => {
      const result = await client.isClusterAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getResource', () => {
    test('should handle unsupported resource types', async () => {
      await expect(
        client.getResource('unsupported-type', 'test', 'default')
      ).rejects.toThrow('Unsupported resource type');
    });
  });

  describe('listResources', () => {
    test('should handle unsupported resource types', async () => {
      await expect(
        client.listResources('unsupported-type')
      ).rejects.toThrow('Unsupported resource type');
    });
  });
});
