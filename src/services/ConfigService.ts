import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, SerializableAppConfig, serializeAppConfig, deserializeAppConfig } from '../types';

export class ConfigService {
  private configFilePath: string;
  private config: AppConfig;

  constructor(configFilePath?: string) {
    const dataDir = path.join(__dirname, '../../data');
    this.configFilePath = configFilePath || path.join(dataDir, 'config.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const data = fs.readFileSync(this.configFilePath, 'utf-8');
        const serializable: SerializableAppConfig = JSON.parse(data);
        return deserializeAppConfig(serializable);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Return default config
    return {
      validationTimeout: 30000,
      debugMode: false,
      theme: 'light'
    };
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const serializable = serializeAppConfig(this.config);
      fs.writeFileSync(this.configFilePath, JSON.stringify(serializable, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getValidationTimeout(): number {
    return this.config.validationTimeout;
  }

  setValidationTimeout(timeout: number): void {
    this.updateConfig({ validationTimeout: timeout });
  }

  getTheme(): 'light' | 'dark' {
    return this.config.theme;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateConfig({ theme });
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  getDebugMode(): boolean {
    return this.config.debugMode;
  }

  setDebugMode(enabled: boolean): void {
    this.updateConfig({ debugMode: enabled });
  }

  getKubernetesContext(): string | undefined {
    return this.config.kubernetesContext;
  }

  setKubernetesContext(context?: string): void {
    this.updateConfig({ kubernetesContext: context });
  }

  getDockerHost(): string | undefined {
    return this.config.dockerHost;
  }

  setDockerHost(host?: string): void {
    this.updateConfig({ dockerHost: host });
  }
}

