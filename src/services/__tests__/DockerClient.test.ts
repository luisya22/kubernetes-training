import { DockerClient } from '../DockerClient';

describe('DockerClient', () => {
  let client: DockerClient;

  beforeEach(() => {
    client = new DockerClient();
  });

  describe('initialization', () => {
    it('should create a DockerClient instance', () => {
      expect(client).toBeInstanceOf(DockerClient);
    });

    it('should accept custom Docker options', () => {
      const customClient = new DockerClient({ socketPath: '/var/run/docker.sock' });
      expect(customClient).toBeInstanceOf(DockerClient);
    });
  });

  describe('listImages', () => {
    it('should return an array of images', async () => {
      const images = await client.listImages();
      expect(Array.isArray(images)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Even if Docker is not available, should return empty array
      const images = await client.listImages();
      expect(Array.isArray(images)).toBe(true);
    });
  });

  describe('getImage', () => {
    it('should return null for non-existent image', async () => {
      const image = await client.getImage('non-existent-image-12345');
      expect(image).toBeNull();
    });
  });

  describe('buildImage', () => {
    it('should return a BuildResult object', async () => {
      // Test with a non-existent path to verify error handling
      const result = await client.buildImage('/non-existent-path', 'Dockerfile', 'test:latest');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('imageId');
      expect(result).toHaveProperty('output');
      expect(Array.isArray(result.output)).toBe(true);
    });
  });

  describe('streamBuildOutput', () => {
    it('should be a function', () => {
      expect(typeof client.streamBuildOutput).toBe('function');
    });
  });
});
