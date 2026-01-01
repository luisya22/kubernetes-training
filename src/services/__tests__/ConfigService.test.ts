import { ConfigService } from '../ConfigService';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigService', () => {
  let configService: ConfigService;
  let testConfigPath: string;

  beforeEach(() => {
    // Use a temporary config file for testing
    testConfigPath = path.join(__dirname, '../../../data/test-config.json');
    configService = new ConfigService(testConfigPath);
  });

  afterEach(() => {
    // Clean up test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('default configuration', () => {
    test('returns default config when no file exists', () => {
      const config = configService.getConfig();
      
      expect(config.validationTimeout).toBe(30000);
      expect(config.debugMode).toBe(false);
      expect(config.theme).toBe('light');
      expect(config.kubernetesContext).toBeUndefined();
      expect(config.dockerHost).toBeUndefined();
    });
  });

  describe('validation timeout', () => {
    test('gets default validation timeout', () => {
      expect(configService.getValidationTimeout()).toBe(30000);
    });

    test('sets and gets validation timeout', () => {
      configService.setValidationTimeout(60000);
      expect(configService.getValidationTimeout()).toBe(60000);
    });

    test('persists validation timeout', () => {
      configService.setValidationTimeout(45000);
      
      // Create new instance to verify persistence
      const newConfigService = new ConfigService(testConfigPath);
      expect(newConfigService.getValidationTimeout()).toBe(45000);
    });
  });

  describe('theme', () => {
    test('gets default theme', () => {
      expect(configService.getTheme()).toBe('light');
    });

    test('sets and gets theme', () => {
      configService.setTheme('dark');
      expect(configService.getTheme()).toBe('dark');
    });

    test('persists theme', () => {
      configService.setTheme('dark');
      
      const newConfigService = new ConfigService(testConfigPath);
      expect(newConfigService.getTheme()).toBe('dark');
    });
  });

  describe('debug mode', () => {
    test('gets default debug mode', () => {
      expect(configService.getDebugMode()).toBe(false);
    });

    test('sets and gets debug mode', () => {
      configService.setDebugMode(true);
      expect(configService.getDebugMode()).toBe(true);
    });

    test('persists debug mode', () => {
      configService.setDebugMode(true);
      
      const newConfigService = new ConfigService(testConfigPath);
      expect(newConfigService.getDebugMode()).toBe(true);
    });
  });

  describe('kubernetes context', () => {
    test('gets undefined kubernetes context by default', () => {
      expect(configService.getKubernetesContext()).toBeUndefined();
    });

    test('sets and gets kubernetes context', () => {
      configService.setKubernetesContext('minikube');
      expect(configService.getKubernetesContext()).toBe('minikube');
    });

    test('persists kubernetes context', () => {
      configService.setKubernetesContext('docker-desktop');
      
      const newConfigService = new ConfigService(testConfigPath);
      expect(newConfigService.getKubernetesContext()).toBe('docker-desktop');
    });

    test('clears kubernetes context when set to undefined', () => {
      configService.setKubernetesContext('minikube');
      configService.setKubernetesContext(undefined);
      expect(configService.getKubernetesContext()).toBeUndefined();
    });
  });

  describe('docker host', () => {
    test('gets undefined docker host by default', () => {
      expect(configService.getDockerHost()).toBeUndefined();
    });

    test('sets and gets docker host', () => {
      configService.setDockerHost('unix:///var/run/docker.sock');
      expect(configService.getDockerHost()).toBe('unix:///var/run/docker.sock');
    });

    test('persists docker host', () => {
      configService.setDockerHost('tcp://localhost:2375');
      
      const newConfigService = new ConfigService(testConfigPath);
      expect(newConfigService.getDockerHost()).toBe('tcp://localhost:2375');
    });

    test('clears docker host when set to undefined', () => {
      configService.setDockerHost('unix:///var/run/docker.sock');
      configService.setDockerHost(undefined);
      expect(configService.getDockerHost()).toBeUndefined();
    });
  });

  describe('updateConfig', () => {
    test('updates multiple config values at once', () => {
      configService.updateConfig({
        validationTimeout: 90000,
        debugMode: true,
        theme: 'dark',
        kubernetesContext: 'kind',
        dockerHost: 'tcp://localhost:2375'
      });

      const config = configService.getConfig();
      expect(config.validationTimeout).toBe(90000);
      expect(config.debugMode).toBe(true);
      expect(config.theme).toBe('dark');
      expect(config.kubernetesContext).toBe('kind');
      expect(config.dockerHost).toBe('tcp://localhost:2375');
    });

    test('persists multiple config updates', () => {
      configService.updateConfig({
        validationTimeout: 120000,
        theme: 'dark'
      });

      const newConfigService = new ConfigService(testConfigPath);
      const config = newConfigService.getConfig();
      expect(config.validationTimeout).toBe(120000);
      expect(config.theme).toBe('dark');
    });
  });

  describe('config persistence', () => {
    test('creates config file on first save', () => {
      configService.setValidationTimeout(50000);
      
      expect(fs.existsSync(testConfigPath)).toBe(true);
    });

    test('loads existing config file', () => {
      // Create a config file manually
      const testConfig = {
        validationTimeout: 75000,
        debugMode: true,
        theme: 'dark',
        kubernetesContext: 'test-context',
        dockerHost: 'test-host'
      };
      
      const dir = path.dirname(testConfigPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));

      // Create new instance and verify it loads the config
      const newConfigService = new ConfigService(testConfigPath);
      const config = newConfigService.getConfig();
      
      expect(config.validationTimeout).toBe(75000);
      expect(config.debugMode).toBe(true);
      expect(config.theme).toBe('dark');
      expect(config.kubernetesContext).toBe('test-context');
      expect(config.dockerHost).toBe('test-host');
    });

    test('handles corrupted config file gracefully', () => {
      // Write invalid JSON
      const dir = path.dirname(testConfigPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(testConfigPath, 'invalid json {');

      // Should fall back to defaults
      const newConfigService = new ConfigService(testConfigPath);
      const config = newConfigService.getConfig();
      
      expect(config.validationTimeout).toBe(30000);
      expect(config.debugMode).toBe(false);
      expect(config.theme).toBe('light');
    });
  });
});
