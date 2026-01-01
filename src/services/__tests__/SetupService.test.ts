import { SetupService } from '../SetupService';
import * as fs from 'fs';
import * as path from 'path';

// Mock the KubernetesClient to avoid import issues
jest.mock('../KubernetesClient');

describe('SetupService', () => {
  let setupService: SetupService;
  let testSetupFilePath: string;

  beforeEach(() => {
    // Use a temporary file for testing
    testSetupFilePath = path.join(__dirname, 'test-setup.json');
    setupService = new SetupService(testSetupFilePath);
    
    // Clean up any existing test file
    if (fs.existsSync(testSetupFilePath)) {
      fs.unlinkSync(testSetupFilePath);
    }
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testSetupFilePath)) {
      fs.unlinkSync(testSetupFilePath);
    }
  });

  describe('isSetupCompleted', () => {
    it('should return false when setup file does not exist', () => {
      expect(setupService.isSetupCompleted()).toBe(false);
    });

    it('should return true when setup is marked as completed', () => {
      setupService.markSetupCompleted();
      expect(setupService.isSetupCompleted()).toBe(true);
    });

    it('should return false when setup file exists but setupCompleted is false', () => {
      fs.writeFileSync(testSetupFilePath, JSON.stringify({ setupCompleted: false }));
      expect(setupService.isSetupCompleted()).toBe(false);
    });
  });

  describe('markSetupCompleted', () => {
    it('should create setup file with setupCompleted flag', () => {
      setupService.markSetupCompleted();
      
      expect(fs.existsSync(testSetupFilePath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(testSetupFilePath, 'utf-8'));
      expect(data.setupCompleted).toBe(true);
      expect(data.completedAt).toBeDefined();
    });
  });

  describe('getInstallationInstructions', () => {
    it('should return OS-specific installation instructions', () => {
      const instructions = setupService.getInstallationInstructions();
      
      expect(instructions).toBeDefined();
      expect(typeof instructions).toBe('string');
      expect(instructions.length).toBeGreaterThan(0);
      
      // Should contain kubectl and Kubernetes references
      expect(instructions.toLowerCase()).toContain('kubernetes');
      expect(instructions.toLowerCase()).toContain('kubectl');
    });
  });

  describe('getOS', () => {
    it('should return a valid OS type', () => {
      const os = setupService.getOS();
      
      expect(os).toBeDefined();
      expect(['windows', 'macos', 'linux']).toContain(os);
    });
  });

  describe('checkKubectlInstalled', () => {
    it('should check if kubectl is installed', async () => {
      const result = await setupService.checkKubectlInstalled();
      
      expect(result).toBeDefined();
      expect(typeof result.installed).toBe('boolean');
      
      if (result.installed) {
        expect(result.version).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    }, 10000); // Increase timeout for command execution
  });

  describe('checkClusterAvailable', () => {
    it('should check if Kubernetes cluster is available', async () => {
      const result = await setupService.checkClusterAvailable();
      
      expect(result).toBeDefined();
      expect(typeof result.available).toBe('boolean');
      
      if (result.available) {
        expect(result.info).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    }, 10000); // Increase timeout for cluster check
  });

  describe('runSetupCheck', () => {
    it('should run full setup check and return status', async () => {
      const status = await setupService.runSetupCheck();
      
      expect(status).toBeDefined();
      expect(typeof status.kubectlInstalled).toBe('boolean');
      expect(typeof status.clusterAvailable).toBe('boolean');
      expect(typeof status.setupCompleted).toBe('boolean');
      
      // setupCompleted should be true only if both kubectl and cluster are available
      if (status.kubectlInstalled && status.clusterAvailable) {
        expect(status.setupCompleted).toBe(true);
      } else {
        expect(status.setupCompleted).toBe(false);
      }
    }, 15000); // Increase timeout for full check
  });
});
